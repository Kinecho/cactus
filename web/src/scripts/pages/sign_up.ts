import "@styles/pages/sign_up.scss"
import {getAuthUI, getAuthUIConfig} from "@web/auth";
import {configureLoginForm} from "@web/mailchimp";
import {PageRoute} from "@web/PageRoutes";
import {LocalStorageKey, setupNavigation} from "@web/util";

setupNavigation({showSignupButton: false, redirectOnSignOut: false});

document.addEventListener('DOMContentLoaded', () => {
    console.log("sign_up loaded");
    const $emailContainer = document.getElementById("email-signup");
    const $divider = document.getElementsByClassName("divider").item(0);
    const $loading = document.getElementById("third-party-loading");
    const $welcomeMessage = document.getElementById("welcome-message");
    const $loginContainer = document.getElementById("third-party-logins");
    const $emailInput = document.getElementById("email-input") as HTMLInputElement;
    configureLoginForm("email-signup");

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


    const ui = getAuthUI();
    const config = getAuthUIConfig({
        signInSuccessPath: PageRoute.SIGNUP_CONFIRMED,
        emailLinkSignInPath: PageRoute.SIGNUP_CONFIRMED,
        signInSuccess: (authResult, redirectUrl) => {
            if (authResult.additionalUserInfo) {
                if (authResult.additionalUserInfo.isNewUser) {
                    return true;
                } else {
                    window.location.href = PageRoute.JOURNAL_HOME;
                    return false;
                }
            }

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
