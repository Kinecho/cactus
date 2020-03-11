import SubscriptionProduct from "@shared/models/SubscriptionProduct";

export interface SubscriptionDetails {
    upcomingInvoice?: SubscriptionInvoice,
    subscriptionProduct?: SubscriptionProduct,
}

export interface SubscriptionInvoice {
    defaultPaymentMethod?: PaymentMethod,
    amountCentsUsd?: number;
    periodStart_epoch_seconds?: number;
    periodEnd_epoch_seconds?: number;
    nextPaymentDate_epoch_seconds?: number
    paid?: boolean;
    status?: InvoiceStatus;
    stripeInvoiceId?: string;
    stripeSubscriptionId?: string;
    isAppleSubscription?: boolean;
    appleProductId?: string
    isAutoRenew?: boolean;
}

export enum CardBrand {
    american_express = "american_express",
    mastercard = "mastercard",
    diners_club = "diners_club",
    discover = "discover",
    jcb = "jcb",
    union_pay = "union_pay",
    visa = "visa",
    unknown = "unknown",
}

export enum InvoiceStatus {
    draft = "draft",
    open = "open",
    paid = "paid",
    uncollectible = "uncollectible",
    void = "void",
    deleted = 'deleted'
}

export interface PaymentMethod {
    card?: CardPaymentMethod,
    default?: boolean,
}

export enum WalletType {
    amex_express_checkout = 'amex_express_checkout',
    apple_pay = 'apple_pay',
    google_pay = 'google_pay',
    masterpass = 'masterpass',
    samsung_pay = 'samsung_pay',
    visa_checkout = 'visa_checkout',
}

export interface CardPaymentMethod {
    brand?: CardBrand;
    country?: string; //ISO Code
    last4?: string;
    expiryMonth?: number,
    expiryYear?: number,
    cardholderName?: string,
    walletType?: WalletType,
}