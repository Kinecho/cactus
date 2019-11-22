import "@styles/pages/index.scss"
import Vue from "vue";
import {configureLoginForm, setupJumpToForm} from '@web/mailchimp'
import {initializeFirebase} from "@web/firebase";
import {PageRoute} from "@shared/PageRoutes";
import {setupNavigation} from "@web/NavigationUtil";
import PremiumPricing from "@components/PremiumPricing.vue";


import {commonInit} from "@web/common";

commonInit();

const firebase = initializeFirebase();
document.addEventListener('DOMContentLoaded', function () {
    console.log("index.js loaded");
    try {
        const features = ['auth', 'database', 'messaging', 'storage', 'functions'].filter(feature => typeof firebase[feature] === 'function');
        console.log(`Firebase SDK loaded with ${features.join(', ')}`)
    } catch (e) {
        console.error('FAILED TO GET FIREBASE', e);
    }


    setupNavigation({
        stickyNav: true,
        showSignupButton: true,
        largeLogoOnDesktop: true,
        showLoginButton: true,
        signUpRedirectUrl: PageRoute.JOURNAL_HOME
    });
    //TODO: change these to use the new flows, commented out below
    //these are the mailchimp signup flows
    // configureMailchimpSignupForm("email-form-bottom");
    // configureMailchimpSignupForm("sign-up-top");

    //Below is the new, firebase auth method
    configureLoginForm("email-form-bottom");
    configureLoginForm("sign-up-top");

    setupJumpToForm();
});

new Vue({
    el: "#premium-pricing",
    template: `<PremiumPricing/>`,
    components: {PremiumPricing: PremiumPricing}
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}