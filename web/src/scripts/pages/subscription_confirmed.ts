import "@styles/pages/subscription_confirmed.scss"
import {handleEmailLinkSignIn} from "@web/auth";
import {initializeFirebase} from "@web/firebase";

const firebase = initializeFirebase();

document.addEventListener('DOMContentLoaded', async function() {
    console.log("Subscription Confirmed Page Loaded");
    const $success = document.getElementById("success-container");
    const $error = document.getElementById("error-container");
    const $loading = document.getElementById("loading-container");
    const $container = document.getElementById("page-container");
    const response = await handleEmailLinkSignIn();
    $loading.classList.add("hidden");
    if (response.success){
        $success.classList.remove("hidden");
    } else {
        $error.classList.remove("hidden");
        // document.getE
        if (response.error){
            $error.getElementsByClassName("message").item(0).textContent = response.error;
        };

    }
});
