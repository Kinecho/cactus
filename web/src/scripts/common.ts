import {init as initAnalytics, startFullstory} from '@web/analytics'
import {initializeFirebase} from "@web/firebase";

initAnalytics();
startFullstory();

initializeFirebase();

document.addEventListener('DOMContentLoaded', function () {
    //Nothing to do here
});