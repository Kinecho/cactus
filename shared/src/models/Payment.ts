import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import Stripe from "stripe";
import {AppleReceiptResponseRawBody} from "@shared/api/AppleApi";
import Logger from "@shared/Logger";

const logger = new Logger("PaymentModel");
export default class Payment extends BaseModel {
    collection = Collection.payments;
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

        const [renewalInfo] = receipt.pending_renewal_info;
        let transactionId: string | undefined = renewalInfo?.original_transaction_id;
        if (!transactionId && receipt.latest_receipt_info?.length > 0) {
            transactionId = receipt.latest_receipt_info[0].transaction_id
        }
        if (transactionId) {
            payment.id = `apple_${transactionId}`;
        } else {
            logger.warn("No transaction ID was determined from the receipt");
        }

        payment.apple = {raw: receipt};

        return payment;
    }
}

interface StripePayment {
    raw?: any;
    checkoutSession?: Stripe.Checkout.Session;
}

interface ApplePayment {
    raw?: AppleReceiptResponseRawBody;
}