export enum QueryParam {
    SENT_TO_EMAIL_ADDRESS = "ref",
    REFERRED_BY_EMAIL = "ref",
    SUBSCRIPTION_PRODUCT_ID = "subproductid",
    MAILCHIMP_EMAIL_ID = "mcuid",
    PURCHASE_AMOUNT = "amount",

    /**
     * @DEPRECATED
     * @type {string}
     */
    PURCHASE_ITEM_ID = 'productId',
    EMAIL = 'e',
    REDIRECT_URL = 'signInSuccessUrl',
    MODE = "mode",
    OOB_CODE = "oobCode",
    API_KEY= "apiKey",
    CONTINUE_URL = "continueUrl",
    LANG = "lang",
    CONTENT_INDEX="slide",
    MESSAGE="message",
    PROMPT_CONTENT_ENTRY_ID="pceid",
    UTM_SOURCE = "utm_source",
    UTM_MEDIUM = "utm_medium",
    NO_NAV = "no_nav",
    SOCIAL_INVITE_ID = "inviteId",
    UNSUBSCRIBE_SUCCESS = "unsub_success",
    ALREADY_UNSUBSCRIBED = "is_unsubbed",
    PREMIUM_DEFAULT = 'prem',
    SELECTED_PRODUCT = 'productId',
    SELECTED_TIER = "tier",
    SELECTED_ELEMENT = "element",
    SELECTED_PERIOD = "period",
    SOURCE_APP = "source-app",
    USE_PROMPT_ID = "prompt",
    UPGRADE_SUCCESS = "upgrade",
    CHART_TYPE = "chart_type",
    CHART_DATA = "chart_data",
    CACTUS_MEMBER_ID = "memberId",
    CORE_VALUES = "coreValues",
    FROM_AUTH = "fromAuth",
    ABBREVIATED = "short",
    AUTH_TOKEN = "token",
    DOWNLOAD_TOKEN = "download_token",
    EMBED="embed",
    CV_LAUNCH = "cvlaunch",
    BG_INDEX = "bg",
    TIER = "tier",
    DISPLAY_NAME = "displayName",
    CLEAR_CACHE = "cc",
    CHECKOUT_SUCCESS_URL = "checkoutSuccessUrl",
    CHECKOUT_CANCEL_URL = "checkoutCancelUrl",
    FROM = "from"
}

export function includesLandingQueryParams(params: object | undefined): boolean {
    const expectedLandingQueryParams: Array<string> = [QueryParam.UTM_SOURCE, 
                                                       QueryParam.UTM_MEDIUM, 
                                                       QueryParam.REFERRED_BY_EMAIL, 
                                                       QueryParam.SOCIAL_INVITE_ID];
    if (params) {
        for (const param of Object.keys(params)) {
            if (expectedLandingQueryParams.includes(param)) {
                return true;
            }
        }
    }
    return false;
}