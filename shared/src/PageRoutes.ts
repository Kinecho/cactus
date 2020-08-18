export enum PageRoute {
    ACCOUNT = "/account",
    AUTHENTICATE_ACTIONS = "/authenticate-actions",
    CHECKOUT = "/checkout",
    CORE_VALUES = "/core-values",
    CORE_VALUES_ASSESSMENT = "/core-values/assessment",
    CORE_VALUES_EMBED = "/core-values/embed",
    FRIENDS = "/friends",
    GAP_ANALYSIS = "/gap-analysis",
    GET_STARTED = "/get-started",
    HELLO_ONBOARDING = "/hello",
    HELLO_CORE_VALUES = "/hello-cv",
    HOME = "/",
    INSIGHTS = "/insights",
    INSIGHTS_EMBED = '/insights-embed',
    JOURNAL = "/journal",
    LOGIN = "/login",
    MEMBER_HOME = "/home",
    NATIVE_APP_MAGIC_LINK_LOGIN = "/app-login-continue",
    PAYMENT_CANCELED = "/cancel",
    PRICING = "/pricing",
    PRIVACY_POLICY = "/privacy-policy",
    PROMOS_ROOT = "/promos",
    PROMPTS_ROOT = "/prompts",
    SIGNUP = "/signup",
    SIGNUP_CONFIRMED = "/confirmed",
    SHARED_REFLECTION = "/reflection",
    SOCIAL = "/activity",
    SPONSOR = "/sponsor",
    TERMS_OF_SERVICE = "/terms-of-service",
    UNSUBSCRIBE_SUCCESS = "/unsubscribe-confirmed",
    WELCOME = "/welcome",
}


export enum NamedRoute {
    CORE_VALUES_NEW = "coreValues.new",
    CORE_VALUES_RESULT = "coreValues.result",
    CORE_VALUES_RESULT_PAGE = "coreValues.result.page",
}

export function getPromptContentPath(entryId: string): string {
    return `${PageRoute.PROMPTS_ROOT}/${entryId}`;
}