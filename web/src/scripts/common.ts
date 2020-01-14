import {init as initAnalytics} from '@web/analytics';
import {startFacebookPixel} from '@web/facebook.js';
import {initializeFirebase} from "@web/firebase";
import {getAllQueryParams, getQueryParam} from "@web/util";
import {includesLandingQueryParams, QueryParam} from "@shared/util/queryParams";
import StorageService, {LocalStorageKey} from "@web/services/StorageService";
import Logger from "@shared/Logger";
import CactusMemberService from "@web/services/CactusMemberService";

const logger = new Logger("common.ts");

let hasCommonInit = false;

//this lets android tell the web about a new token. Should probably add some sort of client secret check here or something.
window.registerFCMToken = async (token?: string) => {
    if (!token) {
        logger.warn("No token was provided. Can not register it");
        return;
    }
    StorageService.saveString(LocalStorageKey.androidFCMToken, token);
    console.log("Saved token to local storage, attempting to register FCM token");
    await CactusMemberService.sharedInstance.registerFCMToken(token);
}

export function commonInit() {
    if (hasCommonInit) {
        logger.warn("Common already initialized, not reinitializing");
        return;
    }

    initAnalytics();
    startFacebookPixel();

    initializeFirebase();

    const emailAutoFill = getQueryParam(QueryParam.EMAIL);
    const referredByEmail = getQueryParam(QueryParam.REFERRED_BY_EMAIL);

    if (emailAutoFill) {
        try {
            window.localStorage.setItem(LocalStorageKey.emailAutoFill, emailAutoFill);
        } catch (e) {
            logger.error("Failed to set emailAutoFill item in local storage", e);
        }
    }

    if (referredByEmail) {
        try {
            window.localStorage.setItem(LocalStorageKey.referredByEmail, referredByEmail);
        } catch (e) {
            logger.error("Failed to set referredByEmail item in local storage", e);
        }
    }


    try {
        const newParams = getAllQueryParams();
        const existingParams = StorageService.getJSON(LocalStorageKey.landingQueryParams);

        let params = newParams;

        // merge new and old together if both exist
        if (newParams && existingParams) {
            params = {...existingParams, ...newParams};
        }

        if (params && includesLandingQueryParams(params)) {
            StorageService.saveJSON(LocalStorageKey.landingQueryParams, params);
        }
    } catch (error) {
        logger.error("Failed to get landing page query parameters", error);
    }

    document.addEventListener('DOMContentLoaded', function () {
        //Nothing to do here

    });

    hasCommonInit = true;

}

commonInit();