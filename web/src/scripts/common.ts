import {init as initAnalytics, startFullstory} from '@web/analytics'
import {initializeFirebase} from "@web/firebase";
import {getAllQueryParams, getQueryParam} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";
import StorageService, {LocalStorageKey} from "@web/services/StorageService";

initAnalytics();
startFullstory();

initializeFirebase();

const emailAutoFill = getQueryParam(QueryParam.EMAIL);
const referredByEmail = getQueryParam(QueryParam.REFERRED_BY_EMAIL);

if (emailAutoFill) {
    try {
        window.localStorage.setItem(LocalStorageKey.emailAutoFill, emailAutoFill);
    } catch (e){
        console.error("Failed to set emailAutoFill item in local storage", e);
    }
}

if (referredByEmail) {
    try {
        window.localStorage.setItem(LocalStorageKey.referredByEmail, referredByEmail);
    } catch (e) {
        console.error("Failed to set referredByEmail item in local storage", e);
    }
}


try {
    const params = getAllQueryParams();
    if (params) {
        StorageService.saveJSON(LocalStorageKey.landingQueryParams, params);
    }
} catch (error) {
    console.error("Failed to get landing page query parameters", error);
}

document.addEventListener('DOMContentLoaded', function () {
    //Nothing to do here

});


//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}