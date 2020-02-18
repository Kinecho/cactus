import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import Stripe from "stripe";
import {getConfig, getHostname} from "@admin/config/configService";
import {CreateSessionRequest, CreateSessionResponse} from "@shared/api/CheckoutTypes";
import chalk from "chalk";
import {QueryParam} from "@shared/util/queryParams";
import {URL} from "url";
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
    const userId = await getAuthUserId(req);

    if (!userId) {
        logger.info("You must be authenticated to create a checkout session.");
        res.sendStatus(401);
        return;
    }

    const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(userId);
    const memberId = member?.id;
    if (!member || !memberId) {
        logger.info("No cactus member was found for the given userId: " + userId);
        res.sendStatus(401);
        return;
    }

    let createResponse: CreateSessionResponse;
    res.contentType("application/json");
    try {
        const sessionRequest = req.body as CreateSessionRequest;
        logger.log(chalk.yellow("request body", JSON.stringify(sessionRequest, null, 2)));

        const successUrl = sessionRequest.successUrl || `${getHostname()}/success`;
        const cancelUrl = sessionRequest.cancelUrl || `${getHostname()}/pricing`;
        const planId = sessionRequest.planId;
        const items = sessionRequest.items;

        const stripeOptions: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ['card'],
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: member.stripeCustomerId ? undefined : member.email,
            customer: member.stripeCustomerId
        };

        if (items && items.length > 0) {
            stripeOptions.line_items = items;
        }

        let chargeAmount: number | undefined | null = 499;
        if (planId) {
            stripeOptions.subscription_data = {
                items: [{
                    plan: planId
                }]
            };

            try {
                const plan = await stripe.plans.retrieve(planId);
                chargeAmount = plan.amount;
            } catch (error) {
                logger.error(`failed to retrieve the plan from stripe with Id: ${planId}`);
                createResponse = {
                    success: false,
                    error: `Unable to find plan '${planId}' in stripe. Can not complete checkout.`,
                    planId
                };
                res.send(createResponse);
                return;
            }
        } else {
            logger.error(`No plan ID was given. Can not initialize session`);
            createResponse = {
                success: false,
                error: `No plan ID was given. Can not initialize session`
            };
            res.send(createResponse);
            return;
        }

        const updatedSuccess = new URL(stripeOptions.success_url);
        updatedSuccess.searchParams.set(QueryParam.PURCHASE_AMOUNT, `${chargeAmount}`);
        updatedSuccess.searchParams.set(QueryParam.PURCHASE_ITEM_ID, `${planId}`);

        logger.log(chalk.blue("success url is", updatedSuccess.toString()));
        stripeOptions.success_url = updatedSuccess.toString();

        logger.log("Stripe Checkout Options", JSON.stringify(stripeOptions, null, 2));
        // @ts-ignore
        const session = await stripe.checkout.sessions.create(stripeOptions);
        logger.info("Stripe session was created: " + JSON.stringify(session, null, 2));

        const checkoutSession = CheckoutSession.stripe({
            memberId: memberId,
            email: member.email,
            sessionId: session.id,
            amount: chargeAmount,
            planId,
            raw: session,
        });

        const savedSession = await AdminCheckoutSessionService.getSharedInstance().save(checkoutSession);
        logger.info("saved the checkout session to firestore: " + stringifyJSON(savedSession, 2));

        createResponse = {
            success: true,
            sessionId: session.id,
            amount: chargeAmount,
            planId,
        };

    } catch (error) {
        logger.error("failed to load stripe checkout", error);
        createResponse = {success: false, error: "Unable to load the checkout page"};
    }
    return res.send(createResponse);
});

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