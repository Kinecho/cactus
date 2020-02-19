import {CactusConfig} from "@shared/CactusConfig";
import * as functions from "firebase-functions";
import Stripe from "stripe";
import Logger from "@shared/Logger";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import AdminCheckoutSessionService from "@admin/services/AdminCheckoutSessionService";
import AdminSlackService from "@admin/services/AdminSlackService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import {getDefaultSubscription, getDefaultTrial} from "@shared/models/MemberSubscription";
import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";
import AdminPaymentService from "@admin/services/AdminPaymentService";
import Payment from "@shared/models/Payment";
import AdminSubscriptionProductService from "@admin/services/AdminSubscriptionProductService";
import {getCustomerId, getStripeId} from "@admin/util/AdminStripeUtils";
import {destructureDisplayName, isBlank} from "@shared/util/StringUtil";
import AdminSubscriptionService from "@admin/services/AdminSubscriptionService";

const logger = new Logger("StripeWebhookService");

export interface WebhookResponse {
    statusCode: number,
    type?: string,
    body?: string | any | undefined,
}

/**
 * Handle stripe webhook events
 * Event types currently being sent:
 *  - checkout.session.completed
 *  - customer.updated
 *  - customer.created
 *
 *  Events to send in the future:
 *  - product.created
 *  - product.deleted
 *  - product.updated
 *  - charge.refunded
 *  - customer.subscription.trial_will_end
 *  - customer.source.updated
 *  - customer.card.updated
 *  - customer.bank_account.updated
 *  - customer.source.expiring
 *  - customer.source.created
 *  - customer.card.created
 *  - customer.bank_account.created
 *  - subscription_schedule.expiring
 *  - customer.subscription.updated
 *  - customer.subscription.deleted
 *  - customer.subscription.created
 */
export default class StripeWebhookService {
    protected static sharedInstance: StripeWebhookService;
    config: CactusConfig;
    stripe: Stripe;

    static getSharedInstance(): StripeWebhookService {
        if (!StripeWebhookService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize StripeWebhookService before using it");
        }
        return StripeWebhookService.sharedInstance;
    }

    static initialize(config: CactusConfig) {
        StripeWebhookService.sharedInstance = new StripeWebhookService(config);
    }

    getSignedEvent(options: { request: functions.https.Request, webhookSigningKey?: string }): Stripe.Event | undefined {
        try {
            const {request, webhookSigningKey = this.config.stripe.webhook_signing_secrets.main} = options;
            const sig = request.header('stripe-signature') || "";
            return this.stripe.webhooks.constructEvent(request.rawBody, sig, webhookSigningKey);
        } catch (error) {
            logger.error("Failed to construct stripe webhook event", error);
            return undefined;
        }
    }

    async handleCheckoutSessionCompletedEvent(event: Stripe.Event): Promise<WebhookResponse> {
        const session = event.data.object as Stripe.Checkout.Session;
        switch (session.mode) {
            case "payment":
                return {statusCode: 204, body: "Payment checkout is not supported. Nothing happened."};
            case "setup":
                return this.handleSetupSessionCompleted(session);
            case "subscription":
                return this.handleSubscriptionCheckoutSessionCompleted(session);
            default:
                return {statusCode: 204, body: "session mode not supported."};
        }
    }

    /**
     * Handle session setup completed. This allows for changing payment methods.
     * Expects metadata to be present such as subscriptionId and customerId and memberId
     * @param {Stripe.Checkout.Session} session
     * @return {Promise<WebhookResponse>}
     */
    async handleSetupSessionCompleted(session: Stripe.Checkout.Session): Promise<WebhookResponse> {
        if (session.mode !== "setup") {
            return {
                statusCode: 400,
                body: `"Expected session mode to be \"setup\" but instead got \"${session.mode}\""`
            };
        }

        const setupIntentId = getStripeId(session.setup_intent);
        if (!setupIntentId) {
            return {statusCode: 200, body: "No metadata was present. Can not process request"};
        }

        const setupIntent = await AdminSubscriptionService.getSharedInstance().fetchStripeSetupIntent(setupIntentId);
        if (!setupIntentId) {
            return {
                statusCode: 200,
                body: `Unable to fetch setupIntent for ID ${setupIntentId}. Can not process request`
            };
        }
        const {subscriptionId, customerId} = setupIntent?.metadata ?? {} as { [key: string]: string | undefined };
        const paymentMethodId = getStripeId(setupIntent?.payment_method);
        if (!paymentMethodId || !customerId) {
            return {
                statusCode: 200,
                body: `Not all required data was found on the setup intent. Can not process request. paymentMethodId = ${paymentMethodId} | subscriptionId = ${subscriptionId} | customerId = ${customerId}`
            };
        }

        try {
            const attachedPaymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {customer: customerId});
            logger.info(`Attached payment method to customer ${customerId}: ${stringifyJSON(attachedPaymentMethod)}`);
            const updatedCustomer = await AdminSubscriptionService.getSharedInstance().updateStripeCustomer(customerId, {invoice_settings: {default_payment_method: paymentMethodId}})
            logger.info(`Updated customer ${updatedCustomer?.id} with invoice settings ${stringifyJSON(updatedCustomer?.invoice_settings)}`);
            if (subscriptionId) {
                await AdminSubscriptionService.getSharedInstance().updateStripeSubscriptionDefaultPaymentMethod(subscriptionId, paymentMethodId);
            }
        } catch (error) {
            logger.error(`Failed to attach payment method to customerId ${customerId}`, error);
        }

        return {statusCode: 200, body: "Updated payment method on subscription and customer"};
    }

    async handleSubscriptionCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<WebhookResponse> {
        if (session.mode !== "subscription") {
            return {
                statusCode: 400,
                body: `"Expected session mode to be \"subscription\" but instead got \"${session.mode}\""`
            };
        }
        const sessionId = session.id;
        if (!sessionId) {
            return {statusCode: 400, body: "No session ID was found"};
        }
        logger.info(stringifyJSON(session, 2));

        const pendingSession = await AdminCheckoutSessionService.getSharedInstance().getByStripeSessionId(sessionId);
        if (!pendingSession) {
            logger.error("Failed to process payment, no pending session found for sessionID" + sessionId);
            await AdminSlackService.getSharedInstance().sendCustomerSupportMessage(`:boom: Failed to process payment, no pending session found for sessionID = \`${sessionId}\`\n\n\`\`\`${JSON.stringify(event, null, 2)}\`\`\``);
            return {
                statusCode: 204,
                body: "No `cactus.pendingSession` was found for the given sessionId: " + sessionId + ". Unable to handle processing the payment"
            }
        }
        const memberId = pendingSession.memberId;
        if (!memberId) {
            return {
                statusCode: 204,
                body: "No `memberId` was found for the given sessionId: " + sessionId + ". Unable to handle processing the payment"
            }
        }
        const cactusMember = await AdminCactusMemberService.getSharedInstance().getById(pendingSession.memberId);
        if (!cactusMember) {
            return {
                statusCode: 204,
                body: "No `memberId` was found for the given sessionId: " + sessionId + ". Unable to handle processing the payment"
            }
        }

        const stripePlanId = pendingSession?.stripe?.planId;
        if (!stripePlanId) {
            return {
                statusCode: 204,
                body: "No `stripe.planId` was found for the given sessionId: " + sessionId + ". Unable to handle processing the payment"
            }
        }

        const subscriptionProduct = await AdminSubscriptionProductService.getSharedInstance().getByStripePlanId({
            planId: stripePlanId,
            onlyAvailableForSale: false
        });

        const stripeSubscriptionId = getStripeId(session.subscription);
        // const stripeSubscription = await this.getStripeSubscription(stripeSubscriptionId);


        const cactusSubscription = cactusMember.subscription ?? getDefaultSubscription();
        cactusSubscription.tier = SubscriptionTier.PLUS;
        cactusSubscription.subscriptionProductId = subscriptionProduct?.entryId || session.metadata?.subscriptionProductId;
        cactusSubscription.stripeSubscriptionId = stripeSubscriptionId;

        const trial = (cactusSubscription.trial || getDefaultTrial());
        trial.activatedAt = new Date();
        cactusSubscription.trial = trial;
        cactusMember.subscription = cactusSubscription;
        cactusMember.stripeCustomerId = getCustomerId(session.customer);
        const payment = Payment.fromStripeCheckoutSession({
            memberId,
            session,
            subscriptionProductId: subscriptionProduct?.entryId
        });

        await AdminPaymentService.getSharedInstance().save(payment);
        await AdminCactusMemberService.getSharedInstance().save(cactusMember, {setUpdatedAt: false});

        return {statusCode: 200, body: `Member ${cactusMember.email} was upgraded to ${cactusSubscription.tier}`};
    };

    async handleCustomerEvent(event: Stripe.Event): Promise<WebhookResponse> {
        const customer = event.data.object as Stripe.Customer;
        const memberId = customer.metadata.memberId;
        if (!memberId) {
            return {statusCode: 200, body: "No member ID found in the metadata, nothing to sync up"};
        }

        const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
        if (!member) {
            return {statusCode: 200, body: `No cactus member found with ID ${memberId}. Nothing to sync up`};
        }

        let hasChanges = false;
        const {firstName, lastName} = destructureDisplayName(customer.name);
        if (isBlank(member.firstName) && !isBlank(firstName)) {
            hasChanges = true;
            member.firstName = firstName;
        }

        if (isBlank(member.lastName) && !isBlank(lastName)) {
            hasChanges = true;
            member.lastName = lastName;
        }

        if (isBlank(member.stripeCustomerId)) {
            member.stripeCustomerId = customer.id;
            hasChanges = true;
        }

        if (hasChanges) {
            logger.info(`Updating cactus member\n ${stringifyJSON(member, 2)}`);
            await AdminCactusMemberService.getSharedInstance().save(member)
        }

        return {statusCode: 200, body: `Updated cactus member with new values? ${hasChanges}`};
    }

    /**
     * Main entry point to handle Stripe webhook events.
     * This method will dispatch the event to the handlers responsible for the specific event type.
     *
     * @param {Stripe.Event} event
     * @return {Promise<WebhookResponse>}
     */
    async handleWebhookEvent(event: Stripe.Event): Promise<WebhookResponse> {
        let response: WebhookResponse = {statusCode: 400, body: "Event type not handled"};
        const type = event.type;
        try {

            switch (type) {
                case 'checkout.session.completed':
                    response = await this.handleCheckoutSessionCompletedEvent(event);
                    break;
                case 'customer.updated':
                case 'customer.created':
                    response = await this.handleCustomerEvent(event);
                    break;
                default:
                    logger.warn(`Stripe checkout event type ${type} not handled\n`, stringifyJSON(event, 2));
                    break;
            }
        } catch (error) {
            logger.error("Unexpected error occurred while handling stripe event", error);
            response.body = {error: "Failed to process event. Unexpected error occurred", message: error.message}
        }
        response.type = type;
        logger.info("Webhook Event Response", JSON.stringify(response, null, 2));

        return response;
    }

    constructor(config: CactusConfig) {
        this.config = config;
        this.stripe = new Stripe(config.stripe.secret_key, {
            apiVersion: '2019-12-03',
        });
    }
}