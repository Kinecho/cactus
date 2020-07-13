import * as express from "express";
import * as cors from "cors";
import Stripe from "stripe";
import { getConfig, getHostname } from "@admin/config/configService";
import {
    AndroidFulfillParams,
    AndroidFulfillRestoredPurchasesParams,
    AndroidFulfillRestorePurchasesResult,
    AndroidFulfillResult, CancelStripeSubscriptionResponse,
    CreateSessionRequest,
    CreateSessionResponse,
    CreateSetupSubscriptionSessionRequest,
    CreateSetupSubscriptionSessionResponse
} from "@shared/api/CheckoutTypes";
import { QueryParam } from "@shared/util/queryParams";
import Logger from "@shared/Logger";
import { getAuthUserId } from "@api/util/RequestUtil";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import CheckoutSession from "@shared/models/CheckoutSession";
import AdminCheckoutSessionService from "@admin/services/AdminCheckoutSessionService";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import StripeWebhookService, { isRawBodyRequest } from "@admin/services/StripeWebhookService";
import AdminSubscriptionService from "@admin/services/AdminSubscriptionService";
import { SubscriptionDetails } from "@shared/models/SubscriptionTypes";
import AdminSubscriptionProductService from "@admin/services/AdminSubscriptionProductService";
import SubscriptionProduct from "@shared/models/SubscriptionProduct";
import AdminSlackService, { ChannelName } from "@admin/services/AdminSlackService";
import { appendQueryParams } from "@shared/util/StringUtil";
import CactusMember from "@shared/models/CactusMember";
import { PageRoute } from "@shared/PageRoutes";
import StripeService from "@admin/services/StripeService";
import { isWebhookPayload } from "@shared/api/RevenueCatApi";
import { publishWebhookEvent as submitRevenueCatEvent } from "@api/pubsub/subscribers/RevenueCatPubSub";
import { OfferDetails } from "@shared/models/PromotionalOffer";

const bodyParser = require('body-parser');
const logger = new Logger("checkoutApp");
const config = getConfig();


const stripe = new Stripe(config.stripe.secret_key, {
    apiVersion: '2019-12-03',
});
const app = express();
logger.info("allowed origins: ", JSON.stringify(config.allowedOrigins));
// Automatically allow cross-origin requests
app.use(cors({
    origin: config.allowedOrigins,
}));

app.get("/", async (req: express.Request, res: express.Response) => {
    const index = 8;
    res.send("totally different...." + index);
});

app.get('/healthcheck', async (req: express.Request, res: express.Response) => {
    res.send(`OK ${ new Date().toISOString() }`);
})

app.post("/stripe/subscriptions/cancel", async (req: express.Request, res: express.Response) => {
    const userId = await getAuthUserId(req);

    const response: CancelStripeSubscriptionResponse = { success: false };
    if (!userId) {
        logger.info("You must be authenticated to create a checkout session.");
        response.error = "You must be logged in to create a checkout session";
        res.status(401).send(response);
        return;
    }
    const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(userId);
    const memberId = member?.id;
    if (!member || !memberId) {
        response.error = "You must have a member associated with your account to create a checkout session";
        res.status(403).send(response);
        return;
    }


    // StripeService.
    const subscriptionId = member.subscription?.stripeSubscriptionId;
    if (!subscriptionId) {
        res.status(400).send({ success: false, error: "Member does not have a stripe subscription" });
        return;
    }
    try {
        //we only need to cancel on Stripe, webhooks will deal with updating the member record as needed.
        await StripeService.getSharedInstance().cancelAtPeriodEnd(subscriptionId);
        const subscriptionInvoice = await AdminSubscriptionService.getSharedInstance().getUpcomingInvoice({ member });
        res.status(200).send({ success: true, subscriptionInvoice });
        return;
    } catch (error) {

    }
});

/**
 * Main entry to handle stripe webhooks. We should send all webhook event types to this single endpoint
 * and the StripeWebhookService will handle (or not) the given event type.
 */
app.post("/stripe/webhooks/main", bodyParser.raw({ type: 'application/json' }), async (req: express.Request, res: express.Response) => {
    if (!isRawBodyRequest(req)) {
        logger.error("Incoming stripe webhook was not of type firebase.https.Request. Can not process request", req.body);
        res.sendStatus(204);
        return
    }

    const event = StripeWebhookService.getSharedInstance().getSignedEvent({
        request: req,
        webhookSigningKey: config.stripe.webhook_signing_secrets.main
    });

    if (!event) {
        const stripeType = req.body?.type || "unknown";
        const slackPayload = { body: req.body, headers: req.headers };
        await AdminSlackService.getSharedInstance().uploadTextSnippet({
            data: stringifyJSON(slackPayload, 2),
            fileType: "json",
            message: `:stripe: \`${ stripeType }\` webhook failed. No event was parsed from the body. Perhaps the signature was invalid?`,
            filename: `stripe-failed-webhook-${ stripeType.replace(".", "-") }-${ (new Date()).toISOString() }.json`,
            channel: ChannelName.engineering
        });
        logger.error("Unable to construct the signed stripe event");
        res.status(400).send("Unable to parse the stripe event. Perhaps it wasn't able verify the signature? ");
        return;
    }

    const result = await StripeWebhookService.getSharedInstance().handleWebhookEvent(event);
    logger.info("Processed webhook event: ", result.type);
    res.status(result.statusCode).send(result);

    return;
});

/**
 * Get a sessionID to setup billing info on an existing subscription
 */
app.post("/sessions/setup-subscription", async (req: express.Request, res: express.Response) => {
    const userId = await getAuthUserId(req);

    const response: CreateSetupSubscriptionSessionResponse = { success: false };
    if (!userId) {
        logger.info("You must be authenticated to create a checkout session.");
        response.error = "You must be logged in to create a checkout session";
        res.status(401).send(response);
        return;
    }
    const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(userId);
    const memberId = member?.id;
    if (!member || !memberId) {
        response.error = "You must have a member associated with your account to create a checkout session";
        res.status(403).send(response);
        return;
    }

    const stripeSubscriptionId = member?.subscription?.stripeSubscriptionId;
    const stripeCustomerId = member?.stripeCustomerId;
    if (!stripeSubscriptionId || !stripeCustomerId) {
        response.error = "member does not have all of the required stripe fields: subscription, customerId";
        res.status(400).send(response);
        return;
    }

    const { successUrl, cancelUrl } = req.body as CreateSetupSubscriptionSessionRequest;
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'setup',
            customer_email: member.email || undefined,
            setup_intent_data: {
                metadata: {
                    memberId: memberId,
                    customerId: stripeCustomerId,
                    subscriptionId: stripeSubscriptionId,
                }
            },
            success_url: successUrl || `${ getHostname() }${ PageRoute.ACCOUNT }?${ QueryParam.MESSAGE }=${ encodeURIComponent("Your payment settings have been successfully updated.") }`,
            cancel_url: cancelUrl || `${ getHostname() }${ PageRoute.ACCOUNT }`,
        });
        response.sessionId = session.id;
        response.success = true;
        res.send(response);
        return;
    } catch (error) {
        logger.error("Failed to create stripe session", error);
        response.error = "Unable to create stripe session";
        response.success = false;
        res.send(response);
        return;
    }
});

/**
 * Get a session ID for stripe checkout. Requires authentication.
 *
 * Note: Unlike sessions created via the Client integration,
 * sessions created via the Server integration do not support creating subscriptions with trial_period_days set at the Plan level.
 * To set a trial period, please pass the desired trial length as the value of the subscription_data.trial_period_days argument.
 */
app.post("/sessions/create-subscription", async (req: express.Request, res: express.Response) => {
    try {
        const userId = await getAuthUserId(req);

        if (!userId) {
            logger.info("You must be authenticated to create a checkout session.");
            res.status(401).send({ unauthorized: true });
            return;
        }
        const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(userId);
        const memberId = member?.id;
        if (!member || !memberId) {
            logger.info("No cactus member was found for the given userId: " + userId);
            res.status(401).send({ unauthorized: true });
            return;
        }
        const {
            subscriptionProductId,
            successUrl = `${ getHostname() }/home?${ QueryParam.UPGRADE_SUCCESS }=success`,
            cancelUrl = `${ getHostname() }/pricing`
        } = req.body as CreateSessionRequest;

        const subscriptionProduct = await AdminSubscriptionProductService.getSharedInstance().getByEntryId(subscriptionProductId);
        if (!subscriptionProduct) {
            res.status(400).send({ message: "Unable to find a subscription product with the entryId " + subscriptionProductId });
            return;
        }

        if (!subscriptionProduct.availableForSale) {
            logger.warn(`Member tried to buy a subscription product that is not available for sale. Member: ${ member.email }, SubscriptionProductId: ${ subscriptionProductId }`);
            await AdminSlackService.getSharedInstance().sendCustomerSupportMessage(`Member tried to buy a subscription product that is not available for sale. Member: ${ member.email }, SubscriptionProductId: ${ subscriptionProductId }`)
            return res.status(404).send({ message: "The product you are looking for could not be found" });
        }

        await AdminSubscriptionService.getSharedInstance().addStripeCustomerToMember(member);
        const currentOffer = member.currentOffer;
        const { createOptions, plan, error } = await buildStripeSubscriptionCheckoutSessionOptions({
            successUrl,
            cancelUrl,
            member,
            subscriptionProduct,
            currentOffer,
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
            offerDetails: currentOffer,
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
        const createResponse: CreateSessionResponse = { success: false, error: "Unable to load the checkout page" };
        return res.send(createResponse);
    }

});

async function buildStripeSubscriptionCheckoutSessionOptions(options: {
    subscriptionProduct: SubscriptionProduct,
    member: CactusMember,
    successUrl: string,
    cancelUrl: string,
    currentOffer?: OfferDetails | null,
}): Promise<{ createOptions?: Stripe.Checkout.SessionCreateParams, error?: string, plan?: Stripe.Plan }> {
    const { subscriptionProduct, member, successUrl, cancelUrl, currentOffer } = options;
    const planId = subscriptionProduct.stripePlanId;
    const subscriptionProductId = subscriptionProduct.entryId;
    const memberId = member.id;

    if (!planId) {
        logger.error(`No plan ID was given. Can not initialize session`);
        return { error: "No plan ID was found on the subscription Product" };
    }

    const plan = await StripeService.getSharedInstance().fetchStripePlan(planId);
    if (!plan) {
        logger.error(`failed to retrieve the plan from stripe with Id: ${ planId }`);
        return { error: `Unable to find plan '${ planId }' in stripe. Can not complete checkout.` };
    }
    const trialDays = currentOffer?.trialDays ?? subscriptionProduct.trialDays ?? 0;

    const chargeAmount = plan.amount;
    const updatedSuccessUrl = appendQueryParams(successUrl, {
        [QueryParam.PURCHASE_AMOUNT]: `${ chargeAmount }`,
        [QueryParam.SUBSCRIPTION_PRODUCT_ID]: `${ subscriptionProductId }`,
    });


    const metadata: Record<string, string> = {
        memberId: `${ memberId }`,
        subscriptionProductId: `${ subscriptionProductId }`,
    }

    if (currentOffer) {
        metadata.offerEntryId = currentOffer.entryId ?? "";
        metadata.offerName = currentOffer.displayName ?? "";
    }

    const stripeSubscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
        items: [{ plan: planId }],
        metadata,
    };
    if (trialDays > 0) {
        stripeSubscriptionData.trial_period_days = trialDays
    }

    const stripeOptions: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        success_url: updatedSuccessUrl,
        cancel_url: cancelUrl,
        customer_email: member.stripeCustomerId ? undefined : member.email,
        customer: member.stripeCustomerId,
        metadata,
        subscription_data: stripeSubscriptionData,
    };
    logger.info("Successfully constructed stripe checkout options", stringifyJSON(stripeOptions, 2));
    return { createOptions: stripeOptions, plan };
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
    const upcomingInvoice = await AdminSubscriptionService.getSharedInstance().getUpcomingInvoice({ member });

    let subscriptionProduct: SubscriptionProduct | undefined;
    const subscriptionProductId = member.subscription?.subscriptionProductId;
    if (subscriptionProductId) {
        subscriptionProduct = await AdminSubscriptionProductService.getSharedInstance().getByEntryId(subscriptionProductId)
    }


    const subscriptionDetails: SubscriptionDetails = {
        upcomingInvoice: upcomingInvoice,
        subscriptionProduct,
    };

    logger.info(`Subscription details for member ${ member.email }: ${ stringifyJSON(subscriptionDetails, 2) }`)
    resp.send(subscriptionDetails);

    return;
});

app.post("/android/fulfill-purchase", async (req, resp) => {
    const userId = await getAuthUserId(req);

    let result: AndroidFulfillResult = { success: false };
    if (!userId) {
        result.message = "You must be authenticated to fulfill a purchase";
        resp.status(401).send(result);
        return;
    }

    const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(userId);
    if (!member) {
        result.message = "No cactus member found for authenticated user";
        resp.status(401).send(result);
        return;
    }

    const params = req.body as AndroidFulfillParams;

    result = await AdminSubscriptionService.getSharedInstance().fulfillAndroidPurchase(member, { purchase: params.purchase });
    result.message = result.message + "\n\nWARNING:\nSTILL USING HARD CODED USER ID";
    resp.status(200).send(result);
    return;
});

app.post("/android/fulfill-restored-purchases", async (req, resp) => {
    const result: AndroidFulfillRestorePurchasesResult = { success: false };
    const userId = await getAuthUserId(req);
    if (!userId) {
        result.message = "You must be authenticated to fulfill a purchase";
        resp.status(401).send(result);
        return;
    }

    const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(userId);
    if (!member) {
        result.message = "No cactus member found for authenticated user";
        resp.status(401).send(result);
        return;
    }

    const params = req.body as AndroidFulfillRestoredPurchasesParams;

    const { fulfillmentResults, success } = await AdminSubscriptionService.getSharedInstance().fulfillRestoredAndroidPurchases(member, params);
    result.success = success;
    result.fulfillResults = fulfillmentResults;

    result.message = result.message + "\n\nWARNING:\nSTILL USING HARD CODED USER ID";
    resp.status(200).send(result);
    return;
});

app.post("/reveneuecat/webhooks", async (req, resp) => {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
        resp.sendStatus(401);
        return
    }
    const authToken = authHeader.split("Bearer ")[1];
    logger.info("Auth token on the request is", authToken);
    logger.info("Expected token value is", config.revenuecat.webhook_bearer_token);
    if (authToken !== config.revenuecat.webhook_bearer_token) {
        resp.sendStatus(403);
        return
    }

    const payload = req.body;

    if (!isWebhookPayload(payload)) {
        logger.warn("The body of the webhook payload did not conform to WebhookPayload type");
        resp.sendStatus(400);
        return;
    }

    logger.info("Authenticated the webhook request", stringifyJSON(payload, 2));

    const messageId = await submitRevenueCatEvent(payload);

    if (!messageId) {
        logger.error("Unable to submit the message successfully. Returning an error code so revenue cat will retry");
        resp.status(500).send("Unable to submit the event for processing");
        return;
    }
    logger.info("Submitted revenuecat message payload. MessageID =", messageId);
    resp.sendStatus(200);
    return;
})

export default app;