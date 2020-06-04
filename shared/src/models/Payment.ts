import { BaseModel, Collection } from "@shared/FirestoreBaseModels";
import Stripe from "stripe";
import {
    AppleVerifiedReceipt,
    AppleServerNotificationBody,
    AppleTransactionInfo,
    getOriginalTransactionId,
    getOriginalTransactionIdFromServerNotification, AppleUnifiedReceipt, AppleProductPrice
} from "@shared/api/AppleApi";
import Logger from "@shared/Logger";
import { AndroidPurchase } from "@shared/api/CheckoutTypes";
import { androidpublisher_v3 } from "googleapis";
import {
    getSubscriptionNotificationDescription,
    getSubscriptionNotificationTypeName,
    SubscriptionNotification,
    SubscriptionNotificationType
} from "@shared/api/GooglePlayBillingTypes";
import Schema$SubscriptionPurchase = androidpublisher_v3.Schema$SubscriptionPurchase;

const logger = new Logger("PaymentModel");

enum Field {
    appleOriginalTransactionId = "apple.originalTransactionId",
    googlePurchaseToken = "google.token",
    stripeCheckoutSessionId = "stripe.checkoutSession.id",
    memberId = "memberId",
    subscriptionProductId = "subscriptionProductId",
}

export default class Payment extends BaseModel {
    collection = Collection.payments;
    static Fields = Field;
    memberId!: string;
    amountCentsUsd?: number;
    subscriptionProductId?: string;
    stripe?: StripePayment;
    apple?: ApplePayment;
    google?: GooglePayment;

    static fromStripeCheckoutSession(options: { session: Stripe.Checkout.Session, subscriptionProductId?: string, memberId: string }): Payment {
        const { session, memberId, subscriptionProductId } = options;
        const payment = new Payment();
        payment.id = `stripe_${ session.id }`;
        payment.stripe = { checkoutSession: session };
        payment.memberId = memberId;
        payment.subscriptionProductId = subscriptionProductId;
        return payment;
    }

    static fromAppleReceipt(options: {
        memberId: string,
        subscriptionProductId: string,
        receipt: AppleVerifiedReceipt,
        productPrice?: AppleProductPrice,
    }): Payment {
        const { memberId: memberId, receipt, subscriptionProductId, productPrice } = options;
        const payment = new Payment();
        payment.memberId = memberId;
        payment.subscriptionProductId = subscriptionProductId;

        const transactionId: string | undefined = getOriginalTransactionId(receipt);
        if (transactionId) {
            payment.id = `apple_${ transactionId }`;
        } else {
            logger.warn("No transaction ID was determined from the receipt");
        }

        const [latestReceiptInfo] = receipt.latest_receipt_info ?? [];
        payment.apple = {
            raw: receipt,
            originalTransactionId: transactionId,
            latestReceiptInfo,
            unifiedReceipt: receipt,
            productPrice,
        };

        return payment;
    }

    updateFromAppleNotification(params: { memberId?: string, notification: AppleServerNotificationBody }) {
        const { memberId: memberId, notification } = params;

        const transactionId: string | undefined = getOriginalTransactionIdFromServerNotification(notification);

        const appleObject = this.apple ?? {
            originalTransactionId: transactionId,
            latestNotificationRaw: notification,
            latestReceiptInfo: notification.latest_receipt_info,
            unifiedReceipt: notification.unified_receipt,
        };
        this.memberId = this.memberId ?? memberId;
        this.apple = appleObject;
    }

    static fromAndroidPurchase(options: { memberId: string, subscriptionProductId: string, purchase: AndroidPurchase, subscriptionPurchase: Schema$SubscriptionPurchase }): Payment {
        const { memberId, subscriptionProductId, purchase, subscriptionPurchase } = options;

        const orderId = purchase.orderId ?? subscriptionPurchase.orderId;
        const payment = new Payment();
        payment.id = orderId ? `google_${ orderId }` : undefined;
        payment.memberId = memberId;
        payment.subscriptionProductId = subscriptionProductId;

        payment.google = {
            ...purchase,
            subscriptionPurchase,
        };

        return payment;
    }

    static fromAndroidNotification(options: {
        memberId: string,
        subscriptionProductId?: string,
        subscriptionPurchase?: Schema$SubscriptionPurchase,
        notification: SubscriptionNotification
    }): Payment {
        const { memberId, subscriptionPurchase, subscriptionProductId, notification } = options;
        const payment = new Payment();
        payment.memberId = memberId;
        payment.subscriptionProductId = subscriptionProductId;
        const orderId = subscriptionPurchase?.orderId;
        payment.id = orderId ? `google_${ orderId }` : undefined;
        payment.google = {
            orderId,
            subscriptionProductId: notification.subscriptionId,
            token: notification.purchaseToken,
            notificationType: notification.notificationType,
            notificationTypeName: getSubscriptionNotificationTypeName(notification.notificationType),
            notificationTypeDescription: getSubscriptionNotificationDescription(notification.notificationType),
            subscriptionPurchase,
        };
        return payment;
    }
}

interface StripePayment {
    raw?: any;
    checkoutSession?: Stripe.Checkout.Session;
}

interface ApplePayment {
    raw?: AppleVerifiedReceipt;
    /**
     * The amount the customer paid, in local currency.
     */
    productPrice?: AppleProductPrice;
    originalTransactionId?: string;
    latestNotificationRaw?: AppleServerNotificationBody;
    latestReceiptInfo?: AppleTransactionInfo;
    unifiedReceipt?: AppleUnifiedReceipt;
}

interface GooglePayment extends AndroidPurchase {
    subscriptionPurchase?: Schema$SubscriptionPurchase;
    notificationType?: SubscriptionNotificationType;
    notificationTypeName?: string;
    notificationTypeDescription?: string;
    purchaseTime?: number
}

