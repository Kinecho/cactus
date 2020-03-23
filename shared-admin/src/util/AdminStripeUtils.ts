import Stripe from "stripe";
import { hasIdField, isNull, isString } from "@shared/util/ObjectUtil";
import {
    CardBrand,
    CardPaymentMethod,
    InvoiceStatus,
    PaymentMethod,
    SubscriptionStatus,
    WalletType
} from "@shared/models/SubscriptionTypes";

export function getCustomerId(customer: Stripe.Customer | string | undefined | null): string | undefined {
    if (isString(customer)) {
        return customer;
    }
    if (isCustomer(customer)) {
        return customer.id || undefined;
    }
    return undefined;
}

export function subscriptionStatusFromStripeInvoice(invoice: Stripe.Invoice): SubscriptionStatus {
    const subscription = invoice.subscription;
    if (isString(subscription)) {
        return SubscriptionStatus.unknown;
    }
    if (!subscription) {
        return SubscriptionStatus.unknown;
    }
    switch (subscription.status) {
        case "active":
            return SubscriptionStatus.active;
        case "incomplete_expired":
        case "incomplete":
        case "unpaid":
            return SubscriptionStatus.expired;
        case "canceled":
            return SubscriptionStatus.canceled;
        case "past_due":
            return SubscriptionStatus.past_due;
        case "trialing":
            return SubscriptionStatus.in_trial;
        default:
            return SubscriptionStatus.unknown;
    }
}

export function getStripeId(input: string | Object | null | undefined): string | undefined {
    if (isNull(input)) {
        return undefined;
    }

    if (isString(input)) {
        return input;
    }

    if (hasIdField(input)) {
        return input.id || undefined;
    }
    return undefined;
}

export function isStripeSubscription(subscription: Stripe.Subscription | string | null | undefined): subscription is Stripe.Subscription {
    if (isNull(subscription)) {
        return false;
    }

    if (isString(subscription)) {
        return false;
    }

    return !!subscription?.id;
}

export function isCustomer(customer: Stripe.Customer | string | null | undefined): customer is Stripe.Customer {
    if (isNull(customer)) {
        return false;
    }

    if (isString(customer)) {
        return false;
    }
    return !!customer?.id;
}

export function isCustomerSource(source: Stripe.CustomerSource | string | null | undefined): source is Stripe.CustomerSource {
    if (isNull(source)) {
        return false;
    }

    if (isString(source)) {
        return false
    }
    return !!source?.id;
}

export function isStripePaymentMethod(input: Stripe.PaymentMethod | string | null | undefined | any): input is Stripe.PaymentMethod {
    if (isNull(input)) {
        return false
    }

    if (isString(input)) {
        return false;
    }

    return input.object === "payment_method";
}

export function isStripeCard(input: Stripe.CustomerSource | string | null | undefined): input is (Stripe.Card) {
    if (isNull(input)) {
        return false
    }

    if (isString(input)) {
        return false;
    }

    return input?.object === "card";
}

export function convertStripeBrand(stripeBrand: string): CardBrand {
    let brand = CardBrand.unknown;
    switch (stripeBrand) {
        case "american_express":
            brand = CardBrand.american_express;
            break;
        case "mastercard":
            brand = CardBrand.mastercard;
            break;
        case "diners_club":
            brand = CardBrand.diners_club;
            break;
        case "discover":
            brand = CardBrand.discover;
            break;
        case "jcb":
            brand = CardBrand.jcb;
            break;
        case "union_pay":
            brand = CardBrand.union_pay;
            break;
        case "visa":
            brand = CardBrand.visa;
            break;
        default:
            brand = CardBrand.unknown;
            break;
    }
    return brand;
}

export function getInvoiceStatusFromStripeStatus(stripeStatus?: Stripe.Invoice.Status | null): InvoiceStatus | undefined {
    let status: InvoiceStatus | undefined = undefined;
    switch (stripeStatus) {
        case 'deleted':
            status = InvoiceStatus.deleted;
            break;
        case 'draft':
            status = InvoiceStatus.draft;
            break;
        case 'open':
            status = InvoiceStatus.open;
            break;
        case 'paid':
            status = InvoiceStatus.paid;
            break;
        case 'uncollectible':
            status = InvoiceStatus.uncollectible;
            break;
        case 'void':
            status = InvoiceStatus.void;
            break;
        default:
            status = undefined;
            break;
    }
    return status;
}

function convertWalletType(stripeWallet?: string | null): WalletType | undefined {
    if (!stripeWallet) {
        return undefined;
    }
    switch (stripeWallet) {
        case "amex_express_checkout":
            return WalletType.amex_express_checkout;
        case "apple_pay":
            return WalletType.apple_pay;

        case "google_pay":
            return WalletType.google_pay;
        case "masterpass":
            return WalletType.masterpass;
        case "samsung_pay":
            return WalletType.samsung_pay;
        case "visa_checkout":
            return WalletType.visa_checkout;
        default:
            return undefined;
    }
}

export function convertCard(stripeCard: Stripe.PaymentMethod.Card | Stripe.Card): CardPaymentMethod {
    const card: CardPaymentMethod = {
        brand: convertStripeBrand(stripeCard.brand),
        expiryMonth: stripeCard.exp_month,
        expiryYear: stripeCard.exp_year,
        last4: stripeCard.last4,
        country: stripeCard.country || undefined,
        cardholderName: undefined, //not sure how we can get this
    };

    const wallet = (stripeCard as Stripe.PaymentMethod.Card).wallet;
    if (wallet) {
        card.walletType = convertWalletType(wallet.type)
    }

    return card;
}

export function buildPaymentMethodFromCard(stripeCard: Stripe.Card): PaymentMethod {
    return {
        card: convertCard(stripeCard)
    };
}

export function convertPaymentMethod(stripeMethod?: Stripe.PaymentMethod, defaultSourceId?: string | undefined): PaymentMethod | undefined {
    if (!stripeMethod) {
        return;
    }
    const stripeCard = stripeMethod.card;
    if (!stripeCard) {
        return undefined;
    }

    if (stripeMethod.card) {
        return {
            card: convertCard(stripeCard),
        };
    }
    return;
}