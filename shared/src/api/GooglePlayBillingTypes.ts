import { isNull } from "@shared/util/ObjectUtil";
import { SubscriptionStatus } from "@shared/models/SubscriptionTypes";
import { CancellationReasonCode } from "@shared/models/MemberSubscription";

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

export function getSubscriptionNotificationDescription(type?: SubscriptionNotificationType): string | undefined {
    if (isNull(type)) {
        return undefined;
    }
    switch (type) {
        case SubscriptionNotificationType.SUBSCRIPTION_RECOVERED:
            return "Subscription was recovered from account hold";
        case SubscriptionNotificationType.SUBSCRIPTION_RENEWED:
            return "Active subscription was renewed";
        case SubscriptionNotificationType.SUBSCRIPTION_CANCELED:
            return "Subscription was either voluntarily or involuntarily cancelled. For voluntary cancellation, sent when the user cancels.";
        case SubscriptionNotificationType.SUBSCRIPTION_PURCHASED:
            return "A new subscription was purchased.";
        case SubscriptionNotificationType.SUBSCRIPTION_ON_HOLD:
            return "A subscription has entered account hold.";
        case SubscriptionNotificationType.SUBSCRIPTION_IN_GRACE_PERIOD:
            return "subscription has entered grace period";
        case SubscriptionNotificationType.SUBSCRIPTION_RESTARTED:
            return "User has reactivated their subscription from Play > Account > Subscriptions (requires opt-in for subscription restoration)";
        case SubscriptionNotificationType.SUBSCRIPTION_PRICE_CHANGE_CONFIRMED:
            return "Subscription price change has successfully been confirmed by the user.";
        case SubscriptionNotificationType.SUBSCRIPTION_DEFERRED:
            return "Subscription's recurrence time has been extended.";
        case SubscriptionNotificationType.SUBSCRIPTION_PAUSED:
            return "Subscription has been paused";
        case SubscriptionNotificationType.SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED:
            return "Subscription pause schedule has been changed.";
        case SubscriptionNotificationType.SUBSCRIPTION_REVOKED:
            return "Subscription has been revoked from the user before the expiration time.";
        case SubscriptionNotificationType.SUBSCRIPTION_EXPIRED:
            return "Subscription has expired.";
        default:
            return undefined;
    }
}

export function getSubscriptionNotificationTypeName(type?: SubscriptionNotificationType): string | undefined {
    if (isNull(type)) {
        return undefined;
    }
    switch (type) {
        case SubscriptionNotificationType.SUBSCRIPTION_RECOVERED:
            return "SUBSCRIPTION_RECOVERED";
        case SubscriptionNotificationType.SUBSCRIPTION_RENEWED:
            return "SUBSCRIPTION_RENEWED";
        case SubscriptionNotificationType.SUBSCRIPTION_CANCELED:
            return "SUBSCRIPTION_CANCELED";
        case SubscriptionNotificationType.SUBSCRIPTION_PURCHASED:
            return "SUBSCRIPTION_PURCHASED";
        case SubscriptionNotificationType.SUBSCRIPTION_ON_HOLD:
            return "SUBSCRIPTION_ON_HOLD";
        case SubscriptionNotificationType.SUBSCRIPTION_IN_GRACE_PERIOD:
            return "SUBSCRIPTION_IN_GRACE_PERIOD";
        case SubscriptionNotificationType.SUBSCRIPTION_RESTARTED:
            return "SUBSCRIPTION_RESTARTED";
        case SubscriptionNotificationType.SUBSCRIPTION_PRICE_CHANGE_CONFIRMED:
            return "SUBSCRIPTION_PRICE_CHANGE_CONFIRMED";
        case SubscriptionNotificationType.SUBSCRIPTION_DEFERRED:
            return "SUBSCRIPTION_DEFERRED";
        case SubscriptionNotificationType.SUBSCRIPTION_PAUSED:
            return "SUBSCRIPTION_PAUSED";
        case SubscriptionNotificationType.SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED:
            return "SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED";
        case SubscriptionNotificationType.SUBSCRIPTION_REVOKED:
            return "SUBSCRIPTION_REVOKED";
        case SubscriptionNotificationType.SUBSCRIPTION_EXPIRED:
            return "SUBSCRIPTION_EXPIRED";
        default:
            return "UNKNOWN";
    }
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

export function getCancelReasonDescription(code?: SubscriptionCancelReasonCode | number | undefined): string | undefined {
    if (isNull(code)) {
        return undefined;
    }
    switch (code) {
        case SubscriptionCancelReasonCode.USER_CANCELED:
            return "User canceled the subscription";
        case SubscriptionCancelReasonCode.SYSTEM_CANCELED:
            return "Subscription was canceled by the system, for example because of a billing problem";
        case SubscriptionCancelReasonCode.SUBSCRIPTION_REPLACED:
            return "Subscription was replaced with a new subscription";
        case SubscriptionCancelReasonCode.DEVELOPER_CANCELED:
            return "Subscription was canceled by the developer";
        default:
            return `Unknown reason code: ${ code }`;
    }
}

export function getCactusCancellationReasonCodeFromGoogleReasonCode(code?: SubscriptionCancelReasonCode | number | undefined): CancellationReasonCode | undefined {
    if (isNull(code)) {
        return undefined;
    }

    switch (code) {
        case SubscriptionCancelReasonCode.USER_CANCELED:
            return CancellationReasonCode.USER_CANCELED;
        case SubscriptionCancelReasonCode.SYSTEM_CANCELED:
            return CancellationReasonCode.EXPIRED;
        case SubscriptionCancelReasonCode.SUBSCRIPTION_REPLACED:
            return CancellationReasonCode.UNAVAILABLE;
        case SubscriptionCancelReasonCode.DEVELOPER_CANCELED:
            return SubscriptionCancelReasonCode.SYSTEM_CANCELED;
        default:
            return CancellationReasonCode.UNKNOWN;
    }
}

export enum SubscriptionCancelReasonCode {
    USER_CANCELED = 0,
    SYSTEM_CANCELED = 1,
    SUBSCRIPTION_REPLACED = 2,
    DEVELOPER_CANCELED = 3
}

export enum GooglePaymentState {
    PAYMENT_PENDING = 0,
    PAYMENT_RECEIVED = 1,
    FREE_TRIAL = 2,
    PENDING_DEFERRED_UPGRADE_OR_DOWNGRADE = 3

}

export function subscriptionStatusFromGooglePaymentState(paymentState?: GooglePaymentState | undefined): SubscriptionStatus {
    if (!paymentState === undefined) {
        return SubscriptionStatus.unknown;
    }
    switch (paymentState) {
        case GooglePaymentState.PAYMENT_PENDING:
            return SubscriptionStatus.pending;
        case GooglePaymentState.PAYMENT_RECEIVED:
            return SubscriptionStatus.active;
        case GooglePaymentState.FREE_TRIAL:
            return SubscriptionStatus.in_trial;
        case GooglePaymentState.PENDING_DEFERRED_UPGRADE_OR_DOWNGRADE:
            return SubscriptionStatus.pending;
        default:
            return SubscriptionStatus.unknown;

    }
}