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
}

export interface LocaleSettings {
    dates: {
        longFormat: string,
        shortFormat: string,
    }
}

export abstract class LocalizedCopy {
    abstract prompts: PromptCopy;
    abstract settings: LocaleSettings
}