import "@styles/pages/sign_up.scss"
import {getAuthUI, getAuthUIConfig} from "@web/auth";

document.addEventListener('DOMContentLoaded', () => {
    console.log("sign_up loaded");

    // Initialize the FirebaseUI Widget using Firebase.
    const ui = getAuthUI();

    const config = getAuthUIConfig({signinSuccessPath: "/", emailLinkSigninPath: "/confirmed"});
    if (ui.isPendingRedirect()) {
        console.log("Is pending redirect.... need to log the user in");
        ui.start('#signup-app', config);

    } else {
        // The start method will wait until the DOM is loaded.
        ui.start('#signup-app', config);
    }

});
