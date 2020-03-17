import {isNull} from "@shared/util/ObjectUtil";

export interface DeveloperNotification {
    version: string,
    packageName: string,
    eventTimeMillis: number,
    oneTimeProductNotification?: OneTimeProductNotification,
    subscriptionNotification?: SubscriptionNotification,
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
    version: string;
    notificationType: number;
    purchaseToken: string;
    sku: string;
}

export interface SubscriptionNotification {
    version: string;
    notificationType: number;
    purchaseToken: string;
    subscriptionId: string;
}

export interface TestNotification {
    version: string;
}

/**
 * See (Google Developer docs)[https://developer.android.com/google/play/billing/realtime_developer_notifications.html] for more info
 */
export enum DeveloperNotificationType {
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