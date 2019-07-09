import {setupNavigation} from "@web/util";
import {configureMailchimpSignupForm, setupJumpToForm} from "@web/mailchimp";
import {init as initAnalytics, startFullstory} from "@web/analytics";
import {initializeFirebase} from "@web/firebase";



export function initializeArticlePage() {
    initializeFirebase();
    initAnalytics();
    startFullstory();

    setupNavigation({showSignupButton: true});
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");

}