export enum PageRoute {
    SIGNUP = "/signup",
    LOGIN = "/login",
    GET_STARTED = "/get-started",
    HOME = "/",
    SIGNUP_CONFIRMED = "/confirmed",
    CHECKOUT = "/checkout",
    MEMBER_HOME = "/home",
    JOURNAL = "/journal",
    PROMPTS_ROOT = "/prompts",
    FRIENDS = "/friends",
    SHARED_REFLECTION = "/reflection",
    SOCIAL = "/activity",
    SPONSOR = "/sponsor",
    ACCOUNT = "/account",
    UNSUBSCRIBE_SUCCESS = "/unsubscribe-confirmed",
    NATIVE_APP_MAGIC_LINK_LOGIN = "/app-login-continue",
    PRICING = "/pricing",
    TERMS_OF_SERVICE = "/terms-of-service",
    PRIVACY_POLICY = "/privacy-policy",
    CORE_VALUES = "/core-values",
    AUTHENTICATE_ACTIONS = "/authenticate-actions",
    PAYMENT_CANCELED = "/cancel",
    GAP_ANALYSIS = "/gap-analysis",
    HELLO_ONBOARDING = "/hello",
    PROMOS_ROOT = "/promos",
    /**
     * @deprecated
     * This is the legacy core values page. It is now redirected to the /core-values route via vue Router
     * @type {string}
     */
    VALUES_HOME = "/values",
    WELCOME = "/welcome",
    INSIGHTS_EMBED = '/insights-embed',
    INSIGHTS = "/insights",
}
