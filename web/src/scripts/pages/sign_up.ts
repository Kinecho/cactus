import "@styles/pages/sign_up.scss"
import {getAuthUI, getAuthUIConfig} from "@web/auth";
import {configureLoginForm} from "@web/mailchimp";

document.addEventListener('DOMContentLoaded', () => {
    console.log("sign_up loaded");
    const $container = document.getElementById("signup-container");
    const $emailContainer = document.getElementById("email-signup");
    const $divider = document.getElementsByClassName("divider").item(0);
    const $loading = document.getElementById("third-party-loading")
    configureLoginForm("email-signup");

    const ui = getAuthUI();
    const config = getAuthUIConfig({signInSuccessPath: "/confirmed", emailLinkSignInPath: "/signup"});

    if (ui.isPendingRedirect()) {
        console.log("Is pending redirect.... need to log the user in");
        $loading.classList.remove("hidden");
        $emailContainer.remove();
        $divider.remove();
        ui.start('#signup-app', config);
    } else {
        $emailContainer.classList.remove("hidden");
        $divider.classList.remove("hidden");
        // The start method will wait until the DOM is loaded.
        ui.start('#signup-app', config);
    }

});
