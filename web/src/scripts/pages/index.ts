import "@styles/pages/index.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'
import {initializeFirebase} from "@web/firebase";
import {setupNavigation} from "@web/util";

const firebase = initializeFirebase();
document.addEventListener('DOMContentLoaded', function () {
    console.log("index.js loaded");

    try {
        const features = ['auth', 'database', 'messaging', 'storage', 'functions'].filter(feature => typeof firebase[feature] === 'function');
        console.log(`Firebase SDK loaded with ${features.join(', ')}`)
    } catch (e) {
        console.error('FAILED TO GET FIREBASE', e);
    }


    setupNavigation({showSignupButton: true});
    //TODO: change these to use the new flows, commented out below
    //these are the mailchimp signup flows
    configureMailchimpSignupForm("email-form-bottom");
    configureMailchimpSignupForm("sign-up-top");

    //Below is the new, firebase auth method
    // configureLoginForm("email-form-bottom");
    // configureLoginForm("sign-up-top");

    setupJumpToForm();
});

