import {isNull} from "@shared/util/ObjectUtil";

export interface DeveloperNotification {
    /**
     * The version of this notification. Initially, this will be “1.0”. This version is distinct from other version fields.
      */
    version: string,

    /**
     * The package name of the application that this notification relates to (for example, com.some.thing).
     */
    packageName: string,

    /**
     * The timestamp of that the event occurred, in milliseconds since the Epoch.
     */
    eventTimeMillis: string,

    /**
     * If this field is present, then this notification relates to a one-time product.
     * It contains additional information related to the one-time product.
     * This field is mutually exclusive with testNotification and subscriptionNotification.
     */
    oneTimeProductNotification?: OneTimeProductNotification,

    /**
     * If this field is present, then this notification relates to a subscription.
     * It contains additional information related to the subscription.
     * This field is mutually exclusive with testNotification and oneTimeProductNotification.
     */
    subscriptionNotification?: SubscriptionNotification,

    /**
     * If this field is present, then this notification relates to a test publish.
     * These are only sent through the Play Developer Console.
     * This field is mutually exclusive with subscriptionNotification and oneTimeProductNotification.
     */
    testNotification?: TestNotification
}

export function isDeveloperNotification(payload: any): payload is DeveloperNotification {
    if (isNull(payload)) {
        return false
    }
    const notif = payload as DeveloperNotification;
    return !!notif.version && !!notif.packageName
}

export interface OneTimeProductNotification {
    /**
     * The version of this notification. Initially, this will be “1.0”. This version is distinct from other version fields.
     */
    version: string;

    /**
     * The type of notification.
     */
    notificationType: OneTimeProductNotificationType;

    /**
     * The token provided to the user’s device when purchase was made.
     */
    purchaseToken: string;

    /**
     * The purchased one-time product ID (for example, ‘sword_001’).
     */
    sku: string;
}

export interface SubscriptionNotification {
    /**
     * The version of this notification. Initially, this will be “1.0”. This version is distinct from other version fields.
     */
    version: string;

    /**
     * The type of notification
     */
    notificationType: SubscriptionNotificationType;

    /**
     * The token provided to the user’s device when the subscription was purchased.
     */
    purchaseToken: string;

    /**
     * The purchased subscription ID (for example, ‘monthly001’).
     */
    subscriptionId: string;
}

export interface TestNotification {
    version: string;
}

export enum OneTimeProductNotificationType {
    ONE_TIME_PRODUCT_PURCHASED = 1,
    ONE_TIME_PRODUCT_CANCELED = 2,
}

/**
 * See (Google Developer docs)[https://developer.android.com/google/play/billing/realtime_developer_notifications.html] for more info
 */
export enum SubscriptionNotificationType {
    /**
     * A subscription was recovered from account hold
     */
    SUBSCRIPTION_RECOVERED = 1,

    /**
     * An active subscription was renewed
     */
    SUBSCRIPTION_RENEWED = 2,

    /**
     * A subscription was either voluntarily or involuntarily cancelled. For voluntary cancellation, sent when the user cancels.
     */
    SUBSCRIPTION_CANCELED = 3,

    /**
     * A new subscription was purchased.
     */
    SUBSCRIPTION_PURCHASED = 4,

    /**
     * A subscription has entered account hold (if enabled).
     */
    SUBSCRIPTION_ON_HOLD = 5,

    /**
     * A subscription has entered grace period (if enabled)
     */
    SUBSCRIPTION_IN_GRACE_PERIOD = 6,

    /**
     * User has reactivated their subscription from Play > Account > Subscriptions (requires opt-in for subscription restoration)
     */
    SUBSCRIPTION_RESTARTED = 7,

    /**
     * A subscription price change has successfully been confirmed by the user.
     */
    SUBSCRIPTION_PRICE_CHANGE_CONFIRMED = 8,

    /**
     *  A subscription's recurrence time has been extended.
     */
    SUBSCRIPTION_DEFERRED = 9,

    /**
     * A subscription has been paused.
     */
    SUBSCRIPTION_PAUSED = 10,

    /**
     * A subscription pause schedule has been changed.
     */
    SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED = 11,

    /**
     * A subscription has been revoked from the user before the expiration time.
     */
    SUBSCRIPTION_REVOKED = 12,

    /**
     * A subscription has expired.
     */
    SUBSCRIPTION_EXPIRED = 13
}