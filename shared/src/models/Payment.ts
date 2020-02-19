import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import Stripe from "stripe";

export default class Payment extends BaseModel {
    collection = Collection.payments;
    memberId!: string;
    amountCentsUsd?: number;
    subscriptionProductId?: string;
    stripe?: StripePayment;

    static fromStripeCheckoutSession(options: { session: Stripe.Checkout.Session, subscriptionProductId?: string, memberId: string }): Payment {
        const {session, memberId, subscriptionProductId} = options;
        const payment = new Payment();
        payment.id = `stripe_${session.id}`;
        payment.stripe = {checkoutSession: session};
        payment.memberId = memberId;
        payment.subscriptionProductId = subscriptionProductId;
        return payment;
    }
}

interface StripePayment {
    raw?: any;
    checkoutSession?: Stripe.Checkout.Session;
}