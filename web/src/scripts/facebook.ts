import { Config } from './config'
import Logger from '@shared/Logger'

const logger = new Logger('facebook')


let fbLoaded = false;

window.fbAsyncInit = function () {
    configureFacebookSdk()
}


export enum FacebookEventNames {
    ACHIEVED_LEVEL = "fb_mobile_level_achieved",
    ADDED_PAYMENT_INFO = "fb_mobile_add_payment_info",
    ADDED_TO_CART = "fb_mobile_add_to_cart",
    ADDED_TO_WISHLIST = "fb_mobile_add_to_wishlist",
    COMPLETED_REGISTRATION = "fb_mobile_complete_registration",
    COMPLETED_TUTORIAL = "fb_mobile_tutorial_completion",
    INITIATED_CHECKOUT = "fb_mobile_initiated_checkout",
    PAGE_VIEW = "fb_page_view",
    RATED = "fb_mobile_rate",
    SEARCHED = "fb_mobile_search",
    SPENT_CREDITS = "fb_mobile_spent_credits",
    UNLOCKED_ACHIEVEMENT = "fb_mobile_achievement_unlocked",
    VIEWED_CONTENT = "fb_mobile_content_view",
}

export enum FacebookParameterNames {
    APP_USER_ID = "_app_user_id",
    APP_VERSION = "_appVersion",
    CONTENT_ID = "fb_content_id",
    CONTENT_TYPE = "fb_content_type",
    CURRENCY = "fb_currency",
    DESCRIPTION = "fb_description",
    LEVEL = "fb_level",
    MAX_RATING_VALUE = "fb_max_rating_value",
    NUM_ITEMS = "fb_num_items",
    PAYMENT_INFO_AVAILABLE = "fb_payment_info_available",
    REGISTRATION_METHOD = "fb_registration_method",
    SEARCH_STRING = "fb_search_string",
    SUCCESS = "fb_success",
}

async function downloadSdk(): Promise<void> {
    const src = "https://connect.facebook.net/en_US/sdk.js";
    logger.info("Downloading facebook sdk....")
    return new Promise(function (resolve, reject) {
        const s = document.createElement('script') as HTMLScriptElement;
        s.src = src;
        s.onload = () => {
            logger.info("Facebook SDK finished");
            resolve()
        };
        s.onerror = (error) => reject(error);
        document.head.appendChild(s);
    });
}

export async function initFacebookSdk() {
    if (fbLoaded) {
        return;
    }
    fbLoaded = true;
    await Promise.all([downloadSdk(), startFacebookPixel()]);
}

function configureFacebookSdk() {
    const fbConfig: facebook.InitParams = {
        appId: Config.facebookAppId,
        xfbml: true,
        version: Config.facebookVersion,
    }
    logger.debug('***SETTING UP FACEBOOK***', fbConfig)
    window.FB.init(fbConfig)
    fbLoaded = true;
    window.FB.AppEvents.logPageView()
}


export function startFacebookPixel() {
    if (Config.facebookPixelID) {
        window.fbq('init', Config.facebookPixelID)
        window.fbq('track', 'PageView')
    }
}
