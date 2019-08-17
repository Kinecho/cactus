import "@styles/pages/sign_up.scss"
import {getAuthUI, getAuthUIConfig} from "@web/auth";
import {configureLoginForm} from "@web/mailchimp";
import {PageRoute} from "@web/PageRoutes";
import {getQueryParam, LocalStorageKey, setupNavigation} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";

setupNavigation({showSignupButton: false, redirectOnSignOut: false});

document.addEventListener('DOMContentLoaded', () => {
    console.log("sign_up loaded");
    const $emailContainer = document.getElementById("email-signup");
    const $divider = document.getElementsByClassName("divider").item(0);
    const $loading = document.getElementById("third-party-loading");
    const $welcomeMessage = document.getElementById("welcome-message");
    const $loginContainer = document.getElementById("third-party-logins");
    const $emailInput = document.getElementById("email-input") as HTMLInputElement;
    const redirectUrlParam = getQueryParam(QueryParam.REDIRECT_URL);
    configureLoginForm("email-signup");

    console.log("Redirect url param is ", redirectUrlParam);
    let autoFillEmail: string | undefined | null;
    try {
        autoFillEmail = localStorage.getItem(LocalStorageKey.emailAutoFill);
    } catch (error) {
        console.error("failed to fetch value from localstorage", error);
    }

    if (autoFillEmail && $emailInput) {
        $emailInput.value = autoFillEmail;
        localStorage.removeItem(LocalStorageKey.emailAutoFill);
    }

    let emailLinkRedirectUrl:string = PageRoute.SIGNUP_CONFIRMED;
    if (redirectUrlParam){
        emailLinkRedirectUrl = `${emailLinkRedirectUrl}?${QueryParam.REDIRECT_URL}=${redirectUrlParam}`
    }

    const ui = getAuthUI();
    const config = getAuthUIConfig({
        signInSuccessPath: redirectUrlParam || PageRoute.JOURNAL_HOME,
        emailLinkSignInPath: redirectUrlParam || PageRoute.JOURNAL_HOME, //Note: email link is currently implemented in auth.js and we don't use firebaseUI
        signInSuccess: (authResult, redirectUrl) => {
            console.log("Redirect URL is", redirectUrl);
            console.log("Just returning true");
            return true;
        }
    });

    if (ui.isPendingRedirect()) {
        console.log("Is pending redirect.... need to log the user in");
        if ($loading) $loading.classList.remove("hidden");
        if ($emailContainer) $emailContainer.classList.add("hidden");
        if ($divider) $divider.classList.add("hidden");
        if ($welcomeMessage) $welcomeMessage.classList.add("hidden");
        if ($loginContainer) {
            $loginContainer.style.height = "0";
            $loginContainer.style.opacity = "0";
        }

        ui.start('#signup-app', config);
    } else {
        if ($emailContainer) $emailContainer.classList.remove("hidden");
        if ($welcomeMessage) $welcomeMessage.classList.remove("hidden");
        if ($divider) $divider.classList.remove("hidden");
        // The start method will wait until the DOM is loaded.
        ui.start('#signup-app', config);
    }
});


//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}