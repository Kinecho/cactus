import { CactusConfig } from "@admin/CactusConfig";
import { Request } from "express";
import Stripe from "stripe";
import Logger from "@shared/Logger";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import AdminCheckoutSessionService from "@admin/services/AdminCheckoutSessionService";
import AdminSlackService, { ChannelName } from "@admin/services/AdminSlackService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import {
    BillingPlatform,
    CancellationReasonCode,
    getDefaultSubscription,
    getDefaultTrial,
    SubscriptionCancellation
} from "@shared/models/MemberSubscription";
import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import AdminPaymentService from "@admin/services/AdminPaymentService";
import Payment from "@shared/models/Payment";
import AdminSubscriptionProductService from "@admin/services/AdminSubscriptionProductService";
import { getCustomerId, getStripeId, isStripeSubscription } from "@admin/util/AdminStripeUtils";
import { destructureDisplayName, isBlank } from "@shared/util/StringUtil";
import StripeService from "@admin/services/StripeService";
import { formatDateTime } from "@shared/util/DateUtil";
import AdminRevenueCatService from "@admin/services/AdminRevenueCatService";

const logger = new Logger("StripeWebhookService");

export interface WebhookResponse {
    statusCode: number,
    type?: string,
    body?: string | any | undefined,
}

export interface RawBodyRequest extends Request {
    rawBody: any
}

export function isRawBodyRequest(input: any): input is RawBodyRequest {
    return !!(input as RawBodyRequest).rawBody && !!(input as RawBodyRequest).header
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

    getSignedEvent(options: { request: RawBodyRequest, webhookSigningKey?: string }): Stripe.Event | undefined {
        try {
            const { request, webhookSigningKey = this.config.stripe.webhook_signing_secrets.main } = options;
            const sig = (request as Request).header('stripe-signature') || "";
            return this.stripe.webhooks.constructEvent(request.rawBody, sig, webhookSigningKey);
        } catch (error) {
            logger.error("Failed to construct stripe webhook event", error.message);
            return undefined;
        }
    }

    async handleCheckoutSessionCompletedEvent(event: Stripe.Event): Promise<WebhookResponse> {
        const session = event.data.object as Stripe.Checkout.Session;
        switch (session.mode) {
            case "payment":
                return { statusCode: 204, body: "Payment checkout is not supported. Nothing happened." };
            case "setup":
                return this.handleSetupSessionCompleted(session);
            case "subscription":
                return this.handleSubscriptionCheckoutSessionCompleted(session);
            default:
                return { statusCode: 204, body: "session mode not supported." };
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
                body: `"Expected session mode to be \"setup\" but instead got \"${ session.mode }\""`
            };
        }

        const setupIntentId = getStripeId(session.setup_intent);
        if (!setupIntentId) {
            return { statusCode: 200, body: "No metadata was present. Can not process request" };
        }

        const setupIntent = await StripeService.getSharedInstance().fetchStripeSetupIntent(setupIntentId);
        if (!setupIntentId) {
            return {
                statusCode: 200,
                body: `Unable to fetch setupIntent for ID ${ setupIntentId }. Can not process request`
            };
        }
        const { subscriptionId, customerId } = setupIntent?.metadata ?? {} as { [key: string]: string | undefined };
        const paymentMethodId = getStripeId(setupIntent?.payment_method);
        if (!paymentMethodId || !customerId) {
            return {
                statusCode: 200,
                body: `Not all required data was found on the setup intent. Can not process request. paymentMethodId = ${ paymentMethodId } | subscriptionId = ${ subscriptionId } | customerId = ${ customerId }`
            };
        }

        try {
            const attachedPaymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
            logger.info(`Attached payment method to customer ${ customerId }: ${ stringifyJSON(attachedPaymentMethod) }`);
            const updatedCustomer = await StripeService.getSharedInstance().updateStripeCustomer(customerId, { invoice_settings: { default_payment_method: paymentMethodId } })
            logger.info(`Updated customer ${ updatedCustomer?.id } with invoice settings ${ stringifyJSON(updatedCustomer?.invoice_settings) }`);
            if (subscriptionId) {
                await StripeService.getSharedInstance().updateStripeSubscriptionDefaultPaymentMethod(subscriptionId, paymentMethodId);
            }
        } catch (error) {
            logger.error(`Failed to attach payment method to customerId ${ customerId }`, error);
        }

        return { statusCode: 200, body: "Updated payment method on subscription and customer" };
    }

    async handleSubscriptionCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<WebhookResponse> {
        if (session.mode !== "subscription") {
            return {
                statusCode: 400,
                body: `"Expected session mode to be \"subscription\" but instead got \"${ session.mode }\""`
            };
        }
        const sessionId = session.id;
        if (!sessionId) {
            return { statusCode: 400, body: "No session ID was found" };
        }
        logger.info(stringifyJSON(session, 2));

        const pendingSession = await AdminCheckoutSessionService.getSharedInstance().getByStripeSessionId(sessionId);
        if (!pendingSession) {
            logger.error("Failed to process payment, no pending session found for sessionID" + sessionId);
            await AdminSlackService.getSharedInstance().sendCustomerSupportMessage(`:boom: Failed to process payment, no pending session found for sessionID = \`${ sessionId }\`\n\n\`\`\`${ JSON.stringify(session, null, 2) }\`\`\``);
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
        const customerId = getCustomerId(session.customer);
        const stripeSubscriptionId = getStripeId(session.subscription);
        const stripeOfferEntryId = session.metadata?.offerEntryId as string | null | undefined;

        const stripeSubscription = await StripeService.getSharedInstance().getStripeSubscription(stripeSubscriptionId);
        if (isStripeSubscription(stripeSubscription) && customerId) {
            const paymentMethod = getStripeId(stripeSubscription.default_payment_method);
            if (paymentMethod) {
                logger.info("Update default payment method on customer");
                await StripeService.getSharedInstance().updateStripeCustomer(customerId, { invoice_settings: { default_payment_method: paymentMethod } })
            }
        }

        const cactusSubscription = cactusMember.subscription ?? getDefaultSubscription();
        cactusSubscription.tier = SubscriptionTier.PLUS;
        cactusSubscription.subscriptionProductId = subscriptionProduct?.entryId || session.metadata?.subscriptionProductId;
        cactusSubscription.stripeSubscriptionId = stripeSubscriptionId;

        const isOptOutTrial = stripeSubscription?.status === "trialing";

        if (isOptOutTrial) {
            cactusSubscription.optOutTrial = {
                startedAt: stripeSubscription?.trial_start ? new Date(stripeSubscription.trial_start * 1000) : undefined,
                endsAt: stripeSubscription?.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined,
                billingPlatform: BillingPlatform.STRIPE,
            }
        } else {
            const trial = (cactusSubscription.trial || getDefaultTrial());
            trial.activatedAt = new Date();
            cactusSubscription.trial = trial;
        }


        cactusMember.subscription = cactusSubscription;

        if (cactusMember.currentOffer && cactusMember.currentOffer?.entryId === stripeOfferEntryId) {
            cactusMember.currentOffer.redeemedAt = new Date();
        }

        cactusMember.stripeCustomerId = customerId;
        const payment = Payment.fromStripeCheckoutSession({
            memberId,
            session,
            subscriptionProductId: subscriptionProduct?.entryId
        });
        if (memberId && stripeSubscriptionId) {
            await AdminRevenueCatService.shared.updateStripeSubscription({
                memberId,
                subscriptionId: stripeSubscriptionId
            });
        }
        await Promise.all([
            AdminPaymentService.getSharedInstance().save(payment),
            AdminCactusMemberService.getSharedInstance().save(cactusMember, { setUpdatedAt: false }),
            AdminRevenueCatService.shared.updateSubscriberAttributes(cactusMember),
        ])
        return { statusCode: 200, body: `Member ${ cactusMember.email } was upgraded to ${ cactusSubscription.tier }` };
    };

    async handleCustomerEvent(event: Stripe.Event): Promise<WebhookResponse> {
        const customer = event.data.object as Stripe.Customer;
        const memberId = customer.metadata.memberId;
        if (!memberId) {
            return { statusCode: 200, body: "No member ID found in the metadata, nothing to sync up" };
        }

        const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
        if (!member) {
            return { statusCode: 200, body: `No cactus member found with ID ${ memberId }. Nothing to sync up` };
        }

        let hasChanges = false;
        const { firstName, lastName } = destructureDisplayName(customer.name);
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
            logger.info(`Updating cactus member\n ${ stringifyJSON(member, 2) }`);
            await AdminCactusMemberService.getSharedInstance().save(member)
        }

        return { statusCode: 200, body: `Updated cactus member with new values? ${ hasChanges }` };
    }

    // async handleInvoicePaymentSucceeded(event: Stripe.Event): Promise<void> {
    //     return;
    // }

    async handleSubscriptionUpdated(event: Stripe.Event): Promise<WebhookResponse> {
        const response: WebhookResponse = {
            statusCode: 204,
            body: { message: "Not actually processed yet" },
        };

        if (event.type !== 'customer.subscription.updated') {
            response.statusCode = 500;
            response.body = { message: "Unable to process this message type. Expected: customer.subscription.updated" };
            logger.error("Invalid message type for handle subscription updated", stringifyJSON(event, 2));
            return response;
        }

        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubscriptionId = subscription.id;
        const customerId = getStripeId(subscription.customer);
        if (!customerId) {
            logger.error("Could not get a customer ID from the event payload", stringifyJSON(event, 2));
            await this.sendSubscriptionErrorSlackMessage({
                subscription,
                eventType: event.type,
                message: "Could not determine the customer"
            });
            response.statusCode = 200;
            response.body = { message: "Could not determine the customer from the payload" };
            return response;
        }

        const member = await AdminCactusMemberService.getSharedInstance().getByStripeCustomerId(customerId);
        if (!member) {
            logger.error("Unable to find a cactus member with stripe customer id: ", customerId);
            await this.sendSubscriptionErrorSlackMessage({
                subscription,
                eventType: event.type,
                message: `Could not find a Cactus Member with stripe customer ID = ${ customerId }`
            });
            response.statusCode = 200;
            response.body = { message: "Could not find a cactus member for this subscription" };
            return response;
        }

        const memberId = member?.id;
        if (memberId && stripeSubscriptionId) {
            logger.info("Updating stripe subscription in revenue cat");
            await AdminRevenueCatService.shared.updateStripeSubscription({
                memberId,
                subscriptionId: stripeSubscriptionId
            });
        }

        const previousAttributes = event.data.previous_attributes as Partial<Stripe.Subscription>;

        if (!subscription.cancel_at_period_end || previousAttributes.cancel_at_period_end !== false) {
            logger.info("Not processing event - only handle cancellation events");
            response.statusCode = 200;
            response.body = { message: "Not processing any events except for cancel at period end. Success." };
            return response
        }

        const cactusSubscription = member.subscription;
        if (!cactusSubscription) {
            logger.error("Unable to find a cactus member with stripe customer id: ", customerId);
            await this.sendSubscriptionErrorSlackMessage({
                subscription,
                eventType: event.type,
                message: `Member ${ member.email } (${ member.id }) did not have a subscription object`
            });
            response.statusCode = 200;
            response.body = { message: `Member ${ member.email } (${ member.id }) did not have a subscription object` };
            return response;
        }


        const accessEndsAt = subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : new Date();
        const initiatedAt = subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : new Date();
        cactusSubscription.cancellation = {
            reasonCode: CancellationReasonCode.USER_CANCELED,
            accessEndsAt: accessEndsAt,
            initiatedAt: initiatedAt,
        };

        member.subscription = cactusSubscription;
        await AdminCactusMemberService.getSharedInstance().save(member, { setUpdatedAt: false });

        response.statusCode = 200;
        response.body = { message: `Successfully processed subscription update ${ member.email } (${ member.id }) to BASIC` };
        await AdminSlackService.getSharedInstance().sendMessage(ChannelName.subscription_status, `:stripe: ${ member.email } (${ member.id }) subscription has been canceled and will end on ${ formatDateTime(accessEndsAt) }`);
        return response;
    }

    async handleSubscriptionDeleted(event: Stripe.Event): Promise<WebhookResponse> {
        const response: WebhookResponse = {
            statusCode: 204,
            body: { message: "Not actually processed yet" },
        };

        if (event.type !== 'customer.subscription.deleted') {
            response.body = { message: "Invalid message type send to handleSubscriptionDeleted" };
            response.statusCode = 500;
            logger.error("Invalid message type for handle subscriptoin deleted", stringifyJSON(event, 2));
            return response;
        }

        const stripeSubscription = event.data.object as Stripe.Subscription;
        const customerId = getStripeId(stripeSubscription.customer);
        if (!customerId) {
            response.statusCode = 400;
            response.body = { message: "Could not determine the customer from the subscription object" };
            logger.error("Could not get a customer ID from the event payload", stringifyJSON(event, 2));
            await this.sendSubscriptionErrorSlackMessage({
                subscription: stripeSubscription,
                eventType: event.type,
                message: "Could not determine the customer"
            });
            return response;
        }

        const member = await AdminCactusMemberService.getSharedInstance().getByStripeCustomerId(customerId);
        if (!member) {
            logger.error("Unable to find a cactus member with stripe customer id: ", customerId);
            await this.sendSubscriptionErrorSlackMessage({
                subscription: stripeSubscription,
                eventType: event.type,
                message: `Could not find a Cactus Member with stripe customer ID = ${ customerId }`
            });
            response.statusCode = 200;
            response.body = { message: "Could not determine the cactus member from the customer id" };
            return response
        }


        const cactusSubscription = member.subscription;
        if (!cactusSubscription) {
            logger.error("Unable to find a cactus member with stripe customer id: ", customerId);
            await this.sendSubscriptionErrorSlackMessage({
                subscription: stripeSubscription,
                eventType: event.type,
                message: `Member ${ member.email } (${ member.id }) did not have a subscription object`
            });
            response.statusCode = 200;
            response.body = { message: "Member did not have a subscription." };
            return response
        }
        const accessEndsAt = stripeSubscription.ended_at ? new Date(stripeSubscription.ended_at * 1000) : new Date();
        cactusSubscription.tier = SubscriptionTier.BASIC;
        const cancellation: SubscriptionCancellation = {
            reasonCode: CancellationReasonCode.USER_CANCELED,
            accessEndsAt: accessEndsAt,
            processedAt: new Date(),
        };

        if (stripeSubscription.canceled_at) {
            cancellation.initiatedAt = new Date(stripeSubscription.canceled_at * 1000);
        }
        cactusSubscription.cancellation = cancellation;
        member.subscription = cactusSubscription;
        await AdminCactusMemberService.getSharedInstance().save(member, { setUpdatedAt: false });

        response.statusCode = 200;
        response.body = { message: `Successfully downgraded ${ member.email } (${ member.id }) to BASIC` };

        await AdminSlackService.getSharedInstance().sendMessage(ChannelName.cancellation_processing, `:stripe: Successfully canceled the subscription for ${ member.email } (${ member.id })`);

        return response;
    }

    async sendSubscriptionErrorSlackMessage(params: { message?: string, subscription: Stripe.Subscription, eventType: string }) {
        const { subscription, message, eventType } = params;
        await AdminSlackService.getSharedInstance().uploadTextSnippet({
            message: `Stripe webhook error on \`${ eventType }\`\n${ message ?? "" }`.trim(),
            data: stringifyJSON(subscription, 2),
            fileType: "json",
            filename: `stripe-webhook-error-${ new Date().toISOString() }.json`,
            channel: ChannelName.engineering,
        })
    }

    async handleInvoicePaymentSucceeded(event: Stripe.Event): Promise<WebhookResponse> {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = getStripeId(invoice.customer);
        if (!customerId) {
            logger.error("Unable to get customer ID from the invoice object", stringifyJSON(event, 2));
            return { statusCode: 500, body: { message: "Unable to get customer ID from the invoice" } };
        }

        const member = await AdminCactusMemberService.getSharedInstance().getByStripeCustomerId(customerId);
        if (!member) {
            logger.warn("Unable to find a cactus member for stripe customerId " + customerId);
            return { statusCode: 200, body: { message: "No cactus member was found for customer ID" } };
        }

        const amount = invoice.amount_paid;
        const pricePaid = `$${ (amount / 100).toFixed(2) }`;
        const productDescription = invoice.lines.data.find(d => true)?.description;
        const subscriptionId = getStripeId(invoice.lines.data.find(d => !!d.subscription)?.subscription);

        const cactusSubscription = member.subscription ?? getDefaultSubscription();
        if (subscriptionId) {
            cactusSubscription.stripeSubscriptionId = subscriptionId;
            cactusSubscription.tier = SubscriptionTier.PLUS;
            member.stripeCustomerId = customerId;
            member.subscription = cactusSubscription;
            logger.info("Saving member subscription", stringifyJSON(member.subscription, 2));
            await AdminCactusMemberService.getSharedInstance().save(member);
        }


        await AdminSlackService.getSharedInstance().sendMessage(ChannelName.cha_ching, `${ member.email } successfully completed an invoice for ${ productDescription } for ${ pricePaid }. Reason: \`${ invoice.billing_reason }\``);

        return {
            statusCode: 200,
            body: {
                message: "updated member subscription",
                member: { email: member.email, id: member.id, subscription: member.subscription }
            }
        }
    }

    /**
     * Main entry point to handle Stripe webhook events.
     * This method will dispatch the event to the handlers responsible for the specific event type.
     *
     * @param {Stripe.Event} event
     * @return {Promise<WebhookResponse>}
     */
    async handleWebhookEvent(event: Stripe.Event): Promise<WebhookResponse> {
        let response: WebhookResponse = { statusCode: 200, body: "Event type not handled" };
        const type = event.type;
        try {
            switch (type) {
                case 'customer.subscription.deleted':
                    //A subscription has ended.
                    response = await this.handleSubscriptionDeleted(event);
                    break;
                case 'customer.subscription.updated':
                    //this will tell us when a subscription has changed - like if it's no longer auto-renewing
                    response = await this.handleSubscriptionUpdated(event);
                    break;
                case 'checkout.session.completed':
                    response = await this.handleCheckoutSessionCompletedEvent(event);
                    break;
                case 'customer.updated':
                case 'customer.created':
                    response = await this.handleCustomerEvent(event);
                    break;
                case 'invoice.payment_succeeded':
                    response = await this.handleInvoicePaymentSucceeded(event);
                    break;
                default:
                    logger.warn(`Stripe checkout event type ${ type } not handled\n`, stringifyJSON(event, 2));
                    break;
            }
        } catch (error) {
            logger.error("Unexpected error occurred while handling stripe event", error);
            response.body = { error: "Failed to process event. Unexpected error occurred", message: error.message }
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