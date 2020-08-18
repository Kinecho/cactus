import {BillingPeriod} from "@shared/models/SubscriptionProduct";

export interface PronounCopy {
    YOU: string
}

export interface PromptCopy {
    TODAY: string,
    ADD_A_NOTE: string,
    EDIT_NOTE: string,
    REFLECT: string,
    SHARE_PROMPT: string,
    DONE: string,
    TAP_ANYWHERE: string,
    CLOSE: string,
    SAVED: string,
    SAVING: string,
    CELEBRATIONS: string[],
    REFLECTIONS: string,
    SECONDS: string,
    SECOND: string,
    MINUTES: string,
    DAY_STREAK: string,
    WEEK_STREAK: string,
    MONTH_STREAK: string,
    GO_HOME: string,
    SIGN_UP_MESSAGE: string,
    SHARE_YOUR_NOTE: string,
    SHARE_NOTE: string,
    SHARE_PROMPT_COPY_MD: string,
}

export interface CommonCopy {
    SIGN_UP: string,
    TRY_IT_FREE: string,
    SIGNING_IN: string,
    LOG_IN: string,
    PRICING: string,
    NEXT: string,
    SUBMIT: string,
    LOG_OUT: string,
    ENTER_YOUR_EMAIL_ADDRESS: string,
    WELCOME: string,
    WELCOME_BACK: string,
    ACCOUNT: string,
    EMAIL: string,
    EMAIL_ADDRESS: string,
    TIER: string,
    TIME_ZONE: string,
    NOTIFICATIONS: string,
    SUBSCRIPTION: string,
    REMOVE: string,
    LOADING: string,
    FIRST_NAME: string,
    LAST_NAME: string,
    HOUR: string,
    MINUTE: string,
    MIN: string,
    DAYS_LEFT: string,
    DAY_LEFT: string,
    DAYS_LEFT_IN_TRIAL: string,
    DAY_LEFT_IN_TRIAL: string,
    TRIAL_ENDS_TODAY: string,
    ENDS_TODAY: string,
    TRIAL: string,
    LEARN_MORE: string,
    IOS: string,
    ANDROID: string,
    VERIFY_IN_GMAIL: string,
    VERIFY_GMAIL_URL: string
}

export interface ElementCopy {
    MEANING: string,
    MEANING_DESCRIPTION: string,
    EXPERIENCE: string,
    EXPERIENCE_DESCRIPTION: string,
    ENERGY: string,
    ENERGY_DESCRIPTION: string,
    EMOTIONS: string,
    EMOTIONS_DESCRIPTION: string,
    RELATIONSHIPS: string,
    RELATIONSHIPS_DESCRIPTION: string,
}

export interface AuthenticationCopy {
    MEMBER_SINCE: string,
    DISPLAY_NAME: string,
    CONNECTED_ACCOUNTS: string,
    SIGN_UP_FREE: string,

    magicLinkSuccess(email: string): string;

}

export interface NavigationCopy {
    ACCOUNT: string
    CORE_VALUES: string
    MY_JOURNAL: string,
    SOCIAL: string,
    JOURNAL: string,
    ACTIVITY: string,
    INSIGHTS: string,
    COMPOSE: string,
    HOME: string
}

export interface LocaleSettings {
    dates: {
        longFormat: string,
        shortFormat: string,
    }
}

export interface ErrorCopy {
    PLEASE_ENTER_A_VALID_EMAIL_ADDRESS: string,
    PLEASE_ENTER_AN_EMAIL_ADDRESS: string,
    SORRY_WE_ARE_HAVING_ISSUES: string,
    SORRY_WE_ARE_HAVING_ISSUES_TRY_AGAIN: string,
}

export interface AccountCopy {
    PREFERRED_NOTIFICATION_TIME: string,
    SELECTED_TIMEZONE_DIFFERS_FROM_DEVICE: string,
    UPDATE_TIMEZONE_TO: string,
    CONFIRM_UPDATE_TIMEZONE: string,
    CANCEL_UPDATE_TIMEZONE: string,
    EMAIL_NOTIFICATION_CHECKBOX_LABEL: string,
    DELETE_ACCOUNT: string,
    PERMANENTLY_DELETE_ACCOUNT: string
}

export interface CheckoutCopy {
    SIGN_IN_TO_CONTINUE_CHECKOUT: string,
    SIGN_IN_TO_CONTINUE_RESTORING_PURCHASES: string,
    UPGRADE: string,
    TRY_CACTUS_PLUS: string,
    CURRENT_PLAN: string,
    MANAGE_MY_PLAN: string,
    PURCHASE: string,
    BILLING_PERIOD: {
        [key in BillingPeriod]: string
    },
    BILLING_PERIOD_PER: {
        [key in BillingPeriod]: string
    }
    TIER_BASIC: string,
    TIER_PLUS: string,
    TIER_PREMIUM: string,
}

export abstract class LocalizedCopy {
    abstract pronouns: PronounCopy;
    abstract prompts: PromptCopy;
    abstract elements: ElementCopy;
    abstract settings: LocaleSettings;
    abstract common: CommonCopy;
    abstract navigation: NavigationCopy;
    abstract error: ErrorCopy;
    abstract auth: AuthenticationCopy;
    abstract account: AccountCopy;
    abstract checkout: CheckoutCopy;

    abstract exclamation(input?: string): string;
}
