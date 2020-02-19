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
    SOURCE_APP = "source-app",
    USE_PROMPT_ID = "prompt",
    UPGRADE_SUCCESS = "upgrade"
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