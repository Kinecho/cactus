import "@styles/pages/index.scss"
import Vue from "vue";
import {configureLoginForm, setupJumpToForm} from '@web/mailchimp'
import {initializeFirebase} from "@web/firebase";
import {PageRoute} from "@shared/PageRoutes";
import {setupNavigation} from "@web/NavigationUtil";
import PremiumPricing from "@components/PremiumPricing.vue";
import AppStoreIcon from "@components/AppStoreIcon.vue";
import PlayStoreIcon from "@components/PlayStoreIcon.vue";
import StandardFooter from "@components/StandardFooter.vue";

import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

commonInit();
const logger = new Logger("index.ts");

const firebase = initializeFirebase();
document.addEventListener('DOMContentLoaded', function () {
    logger.info("index.js loaded");
    try {
        const features = ['auth', 'database', 'messaging', 'storage', 'functions'].filter(feature => typeof firebase[feature] === 'function');
        logger.info(`Firebase SDK loaded with ${features.join(', ')}`)
    } catch (e) {
        logger.error('FAILED TO GET FIREBASE', e);
    }

    setupNavigation({
        showPricing: true,
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

// new Vue({
//     el: "#premium-pricing",
//     template: `
//         <PremiumPricing/>`,
//     components: {PremiumPricing: PremiumPricing}
// });

new Vue({
    el: "#app-store",
    template: `
        <AppStoreIcon/>`,
    components: {AppStoreIcon}
});

new Vue({
    el: "#app-store-top",
    template: `
        <AppStoreIcon :onlyiOS="true" :onlyMobile="true" />`,
    components: {AppStoreIcon}
});

new Vue({
    el: "#play-store",
    template: `
        <PlayStoreIcon/>`,
    components: {PlayStoreIcon}
});

new Vue({
    el: "#play-store-top",
    template: `
        <PlayStoreIcon :onlyAndroid="true" :onlyMobile="true"/>`,
    components: {PlayStoreIcon}, 
});

new Vue({
    el: "#footer",
    template: `
        <StandardFooter :lifted="true"/>`,
    components: {StandardFooter}
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}