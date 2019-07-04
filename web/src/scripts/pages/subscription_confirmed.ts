import "@styles/pages/subscription_confirmed.scss"
import {EmailLinkSignupResult, handleEmailLinkSignIn} from "@web/auth";
import {getAuth, initializeFirebase} from "@web/firebase";
import {triggerWindowResize} from "@web/util";

const firebase = initializeFirebase();

let hasLoaded = false;
getAuth().onAuthStateChanged(async user => {
    if (!hasLoaded && !user){
        const response = await handleEmailLinkSignIn();
        handleResponse(response);
    } else if (!hasLoaded && user){
        showUserSuccess(user);
    }
    hasLoaded = true;

});

function showUserSuccess(user:firebase.User){
    const $success = document.getElementById("success-container");
    const $loading = document.getElementById("loading-container");
    if($success) $success.classList.remove("hidden");
    if($loading) $loading.classList.add("hidden");
    showShareButtons();
}

function showShareButtons(){
    triggerWindowResize();
}

function handleResponse(response:EmailLinkSignupResult){
    const $success = document.getElementById("success-container");
    const $error = document.getElementById("error-container");
    const $loading = document.getElementById("loading-container");
    const $continueContainer = document.getElementById("continue-container");

    if($loading) $loading.classList.add("hidden");
    if (response.success){
        if($success) $success.classList.remove("hidden");
        showShareButtons();
    } else if (response.error && $error){
        $error.classList.remove("hidden");
        // document.getE
        if (response.error){
            const $title = $error.getElementsByClassName("title").item(0) ;
            const $message = $error.getElementsByClassName("message").item(0);
            if ($title) $title.textContent = response.error.title;
            if ($message) $message.textContent = response.error.message;
        }
    }

    if (response.continue && $continueContainer){
        const $button = $continueContainer.getElementsByTagName("a").item(0);
        if ($button){
            $button.text = response.continue.title;
            $button.href = response.continue.url;
        }
        $continueContainer.classList.remove("hidden")
    } else if ($continueContainer) {
        $continueContainer.classList.add("hidden")
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log("Subscription Confirmed Page Loaded");
});
