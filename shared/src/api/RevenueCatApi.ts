import { isNull } from "@shared/util/ObjectUtil";

export enum EventType {
    TEST = "TEST",
    INITIAL_PURCHASE = "INITIAL_PURCHASE",
    NON_RENEWING_PURCHASE = "NON_RENEWING_PURCHASE",
    RENEWAL = "RENEWAL",
    PRODUCT_CHANGE = "PRODUCT_CHANGE",
    CANCELLATION = "CANCELLATION",
    BILLING_ISSUE = "BILLING_ISSUE",
    SUBSCRIBER_ALIAS = "SUBSCRIBER_ALIAS",
}

/**
 * Period type of the transaction
 */
export enum PeriodType {
    /**
     * Free Trial
     * @type {string}
     */
    TRIAL = "TRIAL",

    /**
     * Introductory pricing
     * @type {string}
     */
    INTRO = "INTRO",

    /**
     * Standard subscription
     * @type {string}
     */
    NORMAL = "NORMAL",

    /**
     * Subscriptions granted through RevenueCat
     * @type {string}
     */
    PROMOTIONAL = "PROMOTIONAL",
}

/**
 * The store the subscription belongs to
 */
export enum Store {
    PLAY_STORE = "PLAY_STORE",
    APP_STORE = "APP_STORE",
    STRIPE = "STRIPE",
    MAC_APP_STORE = "MAC_APP_STORE",
    PROMOTIONAL = "PROMOTIONAL",
}

export enum Enviornment {
    SANDBOX = "SANDBOX",
    PRODUCTION = "PRODUCTION",
}

/**
 * Reasons the user's subscription has ended.
 *
 * See [Cancellation Reasons](https://docs.revenuecat.com/docs/webhooks#cancellation-reasons) for more info.
 */
export enum CancelReason {
    /**
     * Subscriber cancelled voluntarily. This event fires when a user unsubscribes, not when the subscription expires.
     * Availability:
     *  - AppStore: YES
     *  - PlayStore: YES
     *  - Web: YES
     *  - Promo: NO
     * @type {string}
     */
    UNSUBSCRIBE = "UNSUBSCRIBE",

    /**
     * Apple or Google could not charge the subscriber using their payment method.
     * Availability:
     *  - AppStore: YES
     *  - PlayStore: YES
     *  - Web: NO
     *  - Promo: NO
     * @type {string}
     */
    BILLING_ERROR = "BILLING_ERROR",

    /**
     * Developer cancelled the subscription.
     * Availability:
     *  - AppStore: NO
     *  - PlayStore: YES
     *  - Web: NO
     *  - Promo: YES
     * @type {string}
     */
    DEVELOPER_INITIATED = "DEVELOPER_INITIATED",

    /**
     * Subscriber did not agree to a price increase.
     *
     * Availability:
     *  - AppStore: YES
     *  - PlayStore: NO
     *  - Web: NO
     *  - Promo: NO
     * @type {string}
     */
    PRICE_INCREASE = "PRICE_INCREASE",


    /**
     * Customer cancelled through Apple support and received a refund,
     * or a Google subscription was refunded through RevenueCat.
     *
     * Availability:
     *  - AppStore: YES
     *  - PlayStore: YES
     *  - Web: NO
     *  - Promo: NO
     * @type {string}
     */
    CUSTOMER_SUPPORT = "CUSTOMER_SUPPORT",

    /**
     * Apple did not provide the reason of the cancellation.
     *
     * Availability:
     *  - AppStore: YES
     *  - PlayStore: NO
     *  - Web: NO
     *  - Promo: NO
     * @type {string}
     */
    UNKNOWN = "UNKNOWN",
}

export interface SubscriberAttributes {
    $email?: string
    $displayName?: string
    $phoneNumber?: string
    $apnsTokens?: string[] | any
    $fcmTokens?: string[] | any

    [key: string]: string | number | null | undefined
}

export interface WebhookEvent {
    type: EventType
    id: string
    app_user_id: string
    original_app_user_id: string
    aliases?: string[]

    /**
     * Product identifier of the subscription.
     */
    product_id: string
    period_type: PeriodType

    /**
     * Time when the transaction was purchased. Measured in milliseconds since Unix epoch
     */
    purchased_at_ms: number

    /**
     * Expiration of the transaction. Measured in milliseconds since Unix epoch. Use this field to determine if a subscription is still active.
     */
    expiration_at_ms?: number | null
    event_timestamp_ms: number
    /**
     * The store environment
     */
    environment: Enviornment

    /**
     * @Deprecated - use the entitlement_ids instead.
     * This value is deprecated, maybe?
     */
    entitlement_id?: string | null;

    /**
     * This can be NULL if the product_id is not mapped to any entitlements.
     */
    entitlement_ids?: string[] | null
    store: Store

    /**
     * Only available for RENEWAL events.
     * Whether the previous transaction was a free trial or not.
     */
    is_trial_conversion?: boolean

    /**
     * Only available for CANCELLATION events.
     * See [Cancellation Reasons](https://docs.revenuecat.com/docs/webhooks#section-cancellation-reasons).
     */
    cancel_reason?: CancelReason

    /**
     * Product identifier of the new product the subscriber has switched to.
     * Only available for App Store subscriptions and PRODUCT_CHANGE events.
     */
    new_product_id?: string

    /**
     * Not available for apps using legacy entitlements.
     * The identifier for the offering that was presented to the user during their initial purchase.
     */
    presented_offering_id?: string | null

    /**
     * Map of attribute names to attribute objects.
     * For more details see the [subscriber attributes guide](https://docs.revenuecat.com/docs/subscriber-attributes).
     */
    subscriber_attributes?: SubscriberAttributes
}

export interface WebhookPayload {
    event: WebhookEvent;
    api_version: "1.0" | string;
}

export function isWebhookEvent(event: any): event is WebhookEvent {
    if (!event || isNull(event)) {
        return false;
    }
    const e = event as WebhookEvent;
    return !!e.type && !!e.id;
}

export function isWebhookPayload(body: any): body is WebhookPayload {
    if (!body || isNull(body)) {
        return false;
    }

    return !!(body as WebhookPayload).api_version && isWebhookEvent(body.event)
}
