// import * as Stripe from "stripe";
// import IPaymentIntent = Stripe.paymentIntents.IPaymentIntent;

import * as Stripe from "stripe";
import IPaymentIntent = Stripe.paymentIntents.IPaymentIntent;

export enum WebhookEventType {
    CheckoutSessionCompleted = "checkout.session.completed",
}

export type StripeString = string|null

export interface WebhookEvent {
    created: number,
    livemode: boolean,
    id: string,
    type: CheckoutSessionCompleted,
    object: string,
    request?: {
        id: string|null,
        idempotency_key: StripeString,
    },
    pending_webhooks: number,
    api_version: string,
    data: any,
}

export interface CheckoutSessionCompleted extends WebhookEvent {
    data: {
        object: {
            id: string,
            object: string,
            billing_address_collection: any|null,
            cancel_url?: string|null,
            client_reference_id?: string|null,
            customer?: string|null,
            customer_email?: string|null,
            display_items: {
                amount: number,
                currency: string,
                custom?: {
                    description?: string|null,
                    images: string[],
                    name: string,
                },
                quantity: number,
                type: string,
            }[],
            livemode: boolean,
            locale?: string|null
            payment_intent: string,
            payment_method_types: string[],
            submit_type?: string|null,
            subscription?: any|null,
            success_url?: string|null,
        }
    }
}

export interface StripeAddress {
    city: string|null,
        country: string|null,
        line1: string|null,
        line2: string|null,
        postal_code: string|null,
        state: string|null
}

export interface PaymentMethod {
    id: string,
    object: string,
    billing_details: {
        address: StripeAddress,
        email: StripeString,
        name: StripeString,
        phone: StripeString,
    },
    card?: {
        brand: string,
        checks: {
            address_line1_check: StripeString,
            address_postal_code_check: StripeString,
            cvc_check: StripeString,
        },
        country: StripeString,
        exp_month: number,
        exp_year: number,
        fingerprint: string,
        funding: string,
        generated_from: StripeString,
        last4: string,
        three_d_secure_usage?: {
            supported: boolean,
        },
        wallet: any|null,
    },
    created: number,
    customer: string,
    livemode: boolean,
    metadata: any,
    type: string,
}

export interface PaymentIntent extends IPaymentIntent {
    payment_method: string,
}