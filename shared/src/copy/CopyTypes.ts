export interface PromptCopy {
    ADD_A_NOTE: string
    EDIT_NOTE: string
    REFLECT: string
    SHARE_PROMPT: string
    DONE: string,
    TAP_ANYWHERE: string,
    CLOSE: string,
    SAVED: string,
    SAVING: string,
    CELEBRATIONS: string[],
    REFLECTIONS: string,
    SECONDS: string,
    MINUTES: string,
    DAY_STREAK: string,
    GO_HOME: string,
    SIGN_UP_MESSAGE: string,
    SHARE_YOUR_NOTE: string,
    SHARE_NOTE: string,
    SHARE_PROMPT_COPY_MD: string,
}

export interface CommonCopy {
    SIGN_UP: string,
    SIGNING_IN: string,
    LOG_IN: string,
    NEXT: string,
    SUBMIT: string,
    LOG_OUT: string,
    ENTER_YOUR_EMAIL_ADDRESS: string,
    WELCOME: string,
    WELCOME_BACK: string,
    ACCOUNT: string,
    EMAIL: string,
    EMAIL_ADDRESS: string,
    TIME_ZONE: string,
    NOTIFICATIONS: string,
    REMOVE: string,
    LOADING: string,
    FIRST_NAME: string,
    LAST_NAME: string,
    HOUR: string,
    MINUTE: string,
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
    AN_ANONYMOUS_USER: string,
    SIGN_UP_FREE: string,

    magicLinkSuccess(email: string): string;

}

export interface NavigationCopy {
    ACCOUNT: string
    MY_JOURNAL: string,
    SOCIAL: string,
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
}

export abstract class LocalizedCopy {
    abstract prompts: PromptCopy;
    abstract elements: ElementCopy;
    abstract settings: LocaleSettings;
    abstract common: CommonCopy;
    abstract navigation: NavigationCopy;
    abstract error: ErrorCopy;
    abstract auth: AuthenticationCopy;
    abstract account: AccountCopy;

    abstract exclamation(input?: string): string;
}
