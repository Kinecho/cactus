import "@styles/pages/sign_up.scss"
import {getAuthUI, getAuthUIConfig} from "@web/auth";
import {configureLoginForm} from "@web/mailchimp";
import {PageRoute} from "@web/PageRoutes";

document.addEventListener('DOMContentLoaded', () => {
    console.log("sign_up loaded");
    const $emailContainer = document.getElementById("email-signup");
    const $divider = document.getElementsByClassName("divider").item(0);
    const $loading = document.getElementById("third-party-loading");
    configureLoginForm("email-signup");


    const ui = getAuthUI();
    const config = getAuthUIConfig({signInSuccessPath: PageRoute.SIGNUP_CONFIRMED, emailLinkSignInPath: PageRoute.SIGNUP});

    if (ui.isPendingRedirect()) {
        console.log("Is pending redirect.... need to log the user in");
        if ($loading) $loading.classList.remove("hidden");
        if ($emailContainer) $emailContainer.remove();
        if($divider) $divider.remove();
        ui.start('#signup-app', config);
    } else {
        if($emailContainer) $emailContainer.classList.remove("hidden");
        if($divider) $divider.classList.remove("hidden");
        // The start method will wait until the DOM is loaded.
        ui.start('#signup-app', config);
    }

});
