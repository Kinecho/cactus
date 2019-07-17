import {init as initAnalytics, startFullstory} from '@web/analytics'
import {initializeFirebase} from "@web/firebase";
import {getQueryParam, LocalStorageKey, removeQueryParam} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";

initAnalytics();
startFullstory();

initializeFirebase();

const email = getQueryParam(QueryParam.EMAIL);

if (email) {
    window.localStorage.setItem(LocalStorageKey.emailForSignIn, email);
    removeQueryParam(QueryParam.EMAIL);
}

document.addEventListener('DOMContentLoaded', function () {
    //Nothing to do here



});