import "@styles/pages/subscription_confirmed.scss"
import {EmailLinkSignupResult, handleEmailLinkSignIn, sendLoginEvent} from "@web/auth";
import {FirebaseUser, getAuth, initializeFirebase} from "@web/firebase";
import {getQueryParam, triggerWindowResize} from "@web/util";
import {PageRoute} from "@shared/PageRoutes";
import {QueryParam} from "@shared/util/queryParams";
import {LocalStorageKey} from "@web/services/StorageService";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";
const logger = new Logger("subscription_confirmed.ts");
commonInit();

let hasLoaded = false;
getAuth().onAuthStateChanged(async user => {
    logger.log("auth state changed. Has Loaded = ", hasLoaded, " User = ", user);
    if (!hasLoaded && !user) {
        logger.log("not logged in and this is the first time. handling email link...");
        hasLoaded = true;
        const response = await handleEmailLinkSignIn();
        await handleResponse(response);
    } else if (!hasLoaded && user) {
        logger.log("user is signed in, and the page has not yet loaded auth");
        hasLoaded = true;
        await handleExistingUserLoginSuccess(user);
    } else {
        logger.log("auth changed, probably has loaded before. Has loaded =", hasLoaded);
    }
    hasLoaded = true;

});

async function handleExistingUserLoginSuccess(user: FirebaseUser) {
    logger.log("redirecting...");

    await sendLoginEvent({user});

    const redirectUrl = getQueryParam(QueryParam.REDIRECT_URL);
    window.location.href = redirectUrl || PageRoute.JOURNAL_HOME;
}

function showShareButtons() {
    triggerWindowResize();
}

async function handleResponse(response: EmailLinkSignupResult) {
    if (response.credential) {

        try {
            if (response.credential.additionalUserInfo && response.credential.additionalUserInfo.isNewUser) {
                localStorage.setItem(LocalStorageKey.newUserSignIn, response.credential.user ? response.credential.user.uid : "true");
            } else {
                localStorage.removeItem(LocalStorageKey.newUserSignIn);
            }
        } catch (e) {
            logger.error("unable to persist new user status to localstorage");
        } finally {
            await sendLoginEvent(response.credential);
            const redirectUrl = getQueryParam(QueryParam.REDIRECT_URL);
            window.location.href = redirectUrl || PageRoute.JOURNAL_HOME;
        }


        return;
    }


    const $success = document.getElementById("success-container");
    const $error = document.getElementById("error-container");
    const $loading = document.getElementById("loading-container");
    const $continueContainer = document.getElementById("continue-container");

    if ($loading) $loading.classList.add("hidden");
    if (response.success) {
        if ($success) $success.classList.remove("hidden");
        showShareButtons();
    } else if (response.error && $error) {
        $error.classList.remove("hidden");
        // document.getE
        if (response.error) {
            const $title = $error.getElementsByClassName("title").item(0);
            const $message = $error.getElementsByClassName("message").item(0);
            if ($title) $title.textContent = response.error.title;
            if ($message) $message.textContent = response.error.message;
        }
    }

    if (response.continue && $continueContainer) {
        const $button = $continueContainer.getElementsByTagName("a").item(0);
        if ($button) {
            $button.text = response.continue.title;
            $button.href = response.continue.url;
        }
        $continueContainer.classList.remove("hidden")
    } else if ($continueContainer) {
        $continueContainer.classList.add("hidden")
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    logger.log("Subscription Confirmed Page Loaded");
});


//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}