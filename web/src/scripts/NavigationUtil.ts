import NavBar from "@components/NavBar.vue";
import Logger from "@shared/Logger";
import { RawLocation } from "vue-router";
import router from "@web/router";

const logger = new Logger("NavigationUtil");

declare interface NavigationOptions {
    showPricing?: boolean,
    showSignupButton?: boolean,
    showLoginButton?: boolean,
    redirectOnSignOut?: boolean,
    signOutRedirectUrl?: string,
    signUpRedirectUrl?: string,
    largeLogoOnDesktop?: boolean,
    stickyNav?: boolean,
}

export function setupNavigation(options: NavigationOptions) {
    const $headers = document.getElementsByTagName("header");
    const $header = $headers ? $headers.item(0) : undefined;
    const $nav = document.getElementById("#top-nav");


    if (!$nav && !$header) {
        logger.warn("Can not find the Vue root element for the nav bar. Not initializing");
        return;
    }
    logger.log("Found a navigation header element, initializing the nav bar");

    window.NavBar = new NavBar({
        el: ($nav || $header) as HTMLElement,
        propsData: {
            showPricing: options.showPricing || false,
            showSignup: options.showSignupButton,
            redirectOnSignOut: options.redirectOnSignOut || false,
            signOutRedirectUrl: options.signOutRedirectUrl,
            largeLogoOnDesktop: options.largeLogoOnDesktop || false,
            showLogin: options.showLoginButton || false,
            isSticky: options.stickyNav,
            loginRedirectUrl: options.signUpRedirectUrl,
        },
        components: { NavBar: NavBar }
    });
}

export async function pushRoute(rawLocation: RawLocation) {
    try {
        await router.push(rawLocation);
    } catch (error) {
        if (error?.name !== "NavigationDuplicated") {
            logger.info(`Failed to push to route ${ rawLocation }`, error)
        }
    }
}