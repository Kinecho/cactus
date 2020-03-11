import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import Stripe from "stripe";
import {AppleReceiptResponseRawBody, getOriginalTransactionId} from "@shared/api/AppleApi";
import Logger from "@shared/Logger";

const logger = new Logger("PaymentModel");

enum Field {
    appleOriginalTransactionId = "apple.originalTransactionId"
}

export default class Payment extends BaseModel {
    collection = Collection.payments;
    static Fields = Field;
    memberId!: string;
    amountCentsUsd?: number;
    subscriptionProductId?: string;
    stripe?: StripePayment;
    apple?: ApplePayment;

    static fromStripeCheckoutSession(options: { session: Stripe.Checkout.Session, subscriptionProductId?: string, memberId: string }): Payment {
        const {session, memberId, subscriptionProductId} = options;
        const payment = new Payment();
        payment.id = `stripe_${session.id}`;
        payment.stripe = {checkoutSession: session};
        payment.memberId = memberId;
        payment.subscriptionProductId = subscriptionProductId;
        return payment;
    }

    static fromAppleReceipt(options: { memberId: string, subscriptionProductId: string, receipt: AppleReceiptResponseRawBody }): Payment {
        const {memberId: memberId, receipt, subscriptionProductId} = options;
        const payment = new Payment();
        payment.memberId = memberId;
        payment.subscriptionProductId = subscriptionProductId;

        const transactionId: string | undefined = getOriginalTransactionId(receipt);
        if (transactionId) {
            payment.id = `apple_${transactionId}`;
        } else {
            logger.warn("No transaction ID was determined from the receipt");
        }

        payment.apple = {raw: receipt, originalTransactionId: transactionId};

        return payment;
    }
}

interface StripePayment {
    raw?: any;
    checkoutSession?: Stripe.Checkout.Session;
}

interface ApplePayment {
    raw?: AppleReceiptResponseRawBody;
    originalTransactionId?: string
}