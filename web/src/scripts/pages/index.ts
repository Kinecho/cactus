import "@styles/pages/index.scss"
import {configureLoginForm, setupJumpToForm} from '@web/mailchimp'
import {initializeFirebase} from "@web/firebase";
const firebase = initializeFirebase();

document.addEventListener('DOMContentLoaded', function () {
    console.log("index.js loaded");

    try {
        const features = ['auth', 'database', 'messaging', 'storage', 'functions'].filter(feature => typeof firebase[feature] === 'function');
        console.log(`Firebase SDK loaded with ${features.join(', ')}`)
    } catch (e) {
        console.error('FAILED TO GET FIREBASE', e);
        document.getElementById('load').innerHTML = 'Error loading the Firebase SDK, check the console.';
    }
    // configureSignupForm("sign-up-top");
    configureLoginForm("sign-up-top");
    // configureSignupForm("email-form-bottom");
    configureLoginForm("email-form-bottom");
    setupJumpToForm();
});

