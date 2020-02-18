import {CactusConfig} from "@shared/CactusConfig";
import * as functions from "firebase-functions";
import Stripe from "stripe";
import Logger from "@shared/Logger";
import {stringifyJSON} from "@shared/util/ObjectUtil";

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
 *  - customer.updated
 *  - customer.created
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

    async handleCheckoutEvent(event: Stripe.Event): Promise<WebhookResponse> {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionId = session.id;
        if (!sessionId) {
            return {statusCode: 400, body: "No session ID was found"};
        }
        return {statusCode: 200, body: "Message was accepted but not processed yet"};
    };

    async handleCustomerCreatedEvent(event: Stripe.Event): Promise<WebhookResponse> {
        return {statusCode: 400, body: "Not implemented"};
    }

    async handleEvent(event: Stripe.Event): Promise<WebhookResponse> {
        let response: WebhookResponse = {statusCode: 400, body: "Event type not handled"};
        const type = event.type;
        try {

            switch (type) {
                case 'checkout.session.completed':
                    response = await this.handleCheckoutEvent(event);
                    break;
                case 'customer.created':
                    response = await this.handleCustomerCreatedEvent(event);
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