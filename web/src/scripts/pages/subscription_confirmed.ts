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
    $success.classList.remove("hidden");
    $loading.classList.add("hidden");
    showShareButtons();
}

function showShareButtons(){
    triggerWindowResize();
}

function handleResponse(response:EmailLinkSignupResult){
    const $success = document.getElementById("success-container");
    const $error = document.getElementById("error-container");
    const $loading = document.getElementById("loading-container");
    const $container = document.getElementById("page-container");
    const $continueContainer = document.getElementById("continue-container");

    $loading.classList.add("hidden");
    if (response.success){
        $success.classList.remove("hidden");
        showShareButtons();
    } else if (response.error){
        $error.classList.remove("hidden");
        // document.getE
        if (response.error){
            $error.getElementsByClassName("title").item(0).textContent = response.error.title;
            $error.getElementsByClassName("message").item(0).textContent = response.error.message;
        }
    }

    if (response.continue){
        const $button = $continueContainer.getElementsByTagName("a").item(0);
        $button.text = response.continue.title;
        $button.href = response.continue.url;
        $continueContainer.classList.remove("hidden")
    } else {
        $continueContainer.classList.add("hidden")
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log("Subscription Confirmed Page Loaded");
});
