import {setupNavigation} from "@web/util";
import {configureMailchimpSignupForm, setupJumpToForm} from "@web/mailchimp";
import {init as initAnalytics, startFullstory} from "@web/analytics";
import {getAuth, initializeFirebase} from "@web/firebase";


export function initializeArticlePage() {
    initializeFirebase();
    initAnalytics();
    startFullstory();

    setupNavigation({showSignupButton: true});
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");

    getAuth().onAuthStateChanged(user => {
        if (user) {
            hideEmailSignupFooter();
        }
    })

}

function hideEmailSignupFooter() {
    const $emails = document.getElementsByClassName("email");
    if ($emails && $emails.length > 0){
        const $emailSectoin = $emails.item(0);
    }
}