import SubscriptionProduct from "@shared/models/SubscriptionProduct";
import { BillingPlatform } from "@shared/models/MemberSubscription";
import { AppleProductPrice } from "@shared/api/AppleApi";

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
    invoiceStatus?: InvoiceStatus;
    stripeInvoiceId?: string;
    stripeSubscriptionId?: string;
    isAppleSubscription?: boolean;
    isGoogleSubscription?: boolean;
    billingPlatform?: BillingPlatform;
    appleProductId?: string
    androidProductId?: string
    androidPackageName?: string
    isAutoRenew?: boolean;
    isExpired?: boolean;
    subscriptionStatus: SubscriptionStatus,
    optOutTrialStartsAt_epoch_seconds?: number,
    optOutTrialEndsAt_epoch_seconds?: number,
    appleProductPrice?: AppleProductPrice,
}

export enum SubscriptionStatus {
    pending = "pending",
    in_trial= "in_trial",
    active = "active",
    expired ="expired",
    canceled = "canceled",
    unknown = "unknown",
    past_due = "past_due",
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