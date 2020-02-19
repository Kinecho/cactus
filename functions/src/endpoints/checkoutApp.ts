import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import Stripe from "stripe";
import {getConfig, getHostname} from "@admin/config/configService";
import {CreateSessionRequest, CreateSessionResponse} from "@shared/api/CheckoutTypes";
import {QueryParam} from "@shared/util/queryParams";
import Logger from "@shared/Logger";
import {getAuthUserId} from "@api/util/RequestUtil";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import CheckoutSession from "@shared/models/CheckoutSession";
import AdminCheckoutSessionService from "@admin/services/AdminCheckoutSessionService";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import StripeWebhookService from "@admin/services/StripeWebhookService";
import AdminSubscriptionService from "@admin/services/AdminSubscriptionService";
import {SubscriptionDetails} from "@shared/models/SubscriptionTypes";
import AdminSubscriptionProductService from "@admin/services/AdminSubscriptionProductService";
import SubscriptionProduct from "@shared/models/SubscriptionProduct";
import AdminSlackService from "@admin/services/AdminSlackService";
import {appendQueryParams} from "@shared/util/StringUtil";
import CactusMember from "@shared/models/CactusMember";

const bodyParser = require('body-parser');

const logger = new Logger("checkoutApp");
const config = getConfig();

const stripe = new Stripe(config.stripe.secret_key, {
    apiVersion: '2019-12-03',
});
const app = express();

// Automatically allow cross-origin requests
app.use(cors({origin: config.allowedOrigins}));

function isFirebaseRequest(_req: any): _req is functions.https.Request {
    return !!_req.rawBody;
}

app.get("/", async (req: express.Request, res: express.Response) => {
    const index = 8;
    res.send("totally different...." + index);
});

/**
 * Main entry to handle stripe webhooks. We should send all webhook event types to this single endpoint
 * and the StripeWebhookService will handle (or not) the given event type.
 */
app.post("/stripe/webhooks/main", bodyParser.raw({type: 'application/json'}), async (req: express.Request, res: express.Response) => {
    if (!isFirebaseRequest(req)) {
        logger.error("Incoming stripe webhook was not of type firebase.https.Request. Can not process request", req.body);
        res.sendStatus(204);
        return
    }

    const event = StripeWebhookService.getSharedInstance().getSignedEvent({
        request: req,
        webhookSigningKey: config.stripe.webhook_signing_secrets.main
    });
    if (!event) {
        logger.error("Unable to construct the signed stripe event");
        res.status(400).send("Unable to parse the stripe event. Perhaps it wasn't able verify the signature? ");
        return;
    }

    const result = await StripeWebhookService.getSharedInstance().handleEvent(event);
    logger.info("Processed webhook event: ", result.type);
    res.status(result.statusCode).send(result);

    return;
});

/**
 * Get a session ID for stripe checkout
 *
 * Note: Unlike sessions created via the Client integration,
 * sessions created via the Server integration do not support creating subscriptions with trial_period_days set at the Plan level.
 * To set a trial period, please pass the desired trial length as the value of the subscription_data.trial_period_days argument.
 */
app.post("/sessions", async (req: express.Request, res: express.Response) => {
    try {
        const userId = await getAuthUserId(req);

        if (!userId) {
            logger.info("You must be authenticated to create a checkout session.");
            res.status(401).send({unauthorized: true});
            return;
        }
        const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(userId);
        const memberId = member?.id;
        if (!member || !memberId) {
            logger.info("No cactus member was found for the given userId: " + userId);
            res.status(401).send({unauthorized: true});
            return;
        }
        const {
            subscriptionProductId,
            successUrl = `${getHostname()}/success`,
            cancelUrl = `${getHostname()}/pricing`
        } = req.body as CreateSessionRequest;

        const subscriptionProduct = await AdminSubscriptionProductService.getSharedInstance().getByEntryId(subscriptionProductId);
        if (!subscriptionProduct) {
            res.status(400).send({message: "Unable to find a subscription product with the entryId " + subscriptionProductId});
            return;
        }

        if (!subscriptionProduct.availableForSale) {
            logger.warn(`Member tried to buy a subscription product that is not available for sale. Member: ${member.email}, SubscriptionProductId: ${subscriptionProductId}`);
            await AdminSlackService.getSharedInstance().sendCustomerSupportMessage(`Member tried to buy a subscription product that is not available for sale. Member: ${member.email}, SubscriptionProductId: ${subscriptionProductId}`)
            return res.status(404).send({message: "The product you are looking for could not be found"});
        }

        await AdminSubscriptionService.getSharedInstance().addStripeCustomerToMember(member);

        const {createOptions, plan, error} = await buildStripeSubscriptionCheckoutSessionOptions({
            successUrl,
            cancelUrl,
            member,
            subscriptionProduct
        });

        if (error || !(createOptions && plan)) {
            const errorResponse: CreateSessionResponse = {
                error: error || "Unable to build a checkout response",
                success: false
            };
            res.status(400).send(errorResponse);
            return;
        }

        const chargeAmount = plan.amount;
        const session = await stripe.checkout.sessions.create(createOptions);
        logger.info("Stripe session was created: " + JSON.stringify(session, null, 2));

        const cactusCheckoutSession = CheckoutSession.stripe({
            memberId: memberId,
            email: member.email,
            sessionId: session.id,
            amount: chargeAmount,
            planId: plan.id,
            raw: session,
        });

        const savedSession = await AdminCheckoutSessionService.getSharedInstance().save(cactusCheckoutSession);
        logger.info("saved the checkout session to firestore: " + stringifyJSON(savedSession, 2));

        const createResponse: CreateSessionResponse = {
            success: true,
            sessionId: session.id,
            amount: chargeAmount,
        };
        return res.send(createResponse);
    } catch (error) {
        logger.error("failed to load stripe checkout", error);
        const createResponse: CreateSessionResponse = {success: false, error: "Unable to load the checkout page"};
        return res.send(createResponse);
    }

});

async function buildStripeSubscriptionCheckoutSessionOptions(options: {
    subscriptionProduct: SubscriptionProduct,
    member: CactusMember,
    successUrl: string,
    cancelUrl: string
}): Promise<{ createOptions?: Stripe.Checkout.SessionCreateParams, error?: string, plan?: Stripe.Plan }> {
    const {subscriptionProduct, member, successUrl, cancelUrl} = options;
    const planId = subscriptionProduct.stripePlanId;
    const subscriptionProductId = subscriptionProduct.entryId;
    const memberId = member.id;

    if (!planId) {
        logger.error(`No plan ID was given. Can not initialize session`);
        return {error: "No plan ID was found on the subscription Product"};
    }

    const plan = await AdminSubscriptionService.getSharedInstance().fetchStripePlan(planId);
    if (!plan) {
        logger.error(`failed to retrieve the plan from stripe with Id: ${planId}`);
        return {error: `Unable to find plan '${planId}' in stripe. Can not complete checkout.`};
    }

    const chargeAmount = plan.amount;
    const updatedSuccessUrl = appendQueryParams(successUrl, {
        [QueryParam.PURCHASE_AMOUNT]: `${chargeAmount}`,
        [QueryParam.SUBSCRIPTION_PRODUCT_ID]: `${subscriptionProductId}`,
    });

    const stripeOptions: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        success_url: updatedSuccessUrl,
        cancel_url: cancelUrl,
        customer_email: member.stripeCustomerId ? undefined : member.email,
        customer: member.stripeCustomerId,
        metadata: {
            memberId: `${memberId}`,
            subscriptionProductId: `${subscriptionProductId}`,
        },
        subscription_data: {
            items: [{
                plan: planId
            }]
        }
    };
    logger.info("Successfully constructed stripe checkout options", stringifyJSON(stripeOptions, 2));
    return {createOptions: stripeOptions, plan};
}

/**
 * @type {SubscriptionDetails}
 * Returns a {SubscriptionDetails} object
 */
app.get("/subscription-details", async (req: express.Request, resp: express.Response) => {
    const userId = await getAuthUserId(req);
    if (!userId) {
        resp.sendStatus(401);
        return;
    }

    const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(userId);
    if (!member) {
        resp.sendStatus(401);
        return;
    }
    // const memberId = member.id!;
    const upcomingInvoice = await AdminSubscriptionService.getSharedInstance().getUpcomingInvoice({member});

    let subscriptionProduct: SubscriptionProduct | undefined;
    const subscriptionProductId = member.subscription?.subscriptionProductId;
    if (subscriptionProductId) {
        subscriptionProduct = await AdminSubscriptionProductService.getSharedInstance().getByEntryId(subscriptionProductId)
    }


    const subscriptionDetails: SubscriptionDetails = {
        upcomingInvoice: upcomingInvoice,
        subscriptionProduct,
    };

    logger.info(`Subscription details for member ${member.email}: ${stringifyJSON(subscriptionDetails, 2)}`)
    resp.send(subscriptionDetails);

    return;
});

export default app;