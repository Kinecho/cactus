import "@styles/pages/sign_up.scss"
import {getAuthUI, getAuthUIConfig} from "@web/auth";
import {configureLoginForm} from "@web/mailchimp";
import {PageRoute} from "@web/PageRoutes";
import {getQueryParam, setupNavigation} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";
import {LocalStorageKey} from "@web/services/StorageService";
import Vue from "vue";
import SignIn from "@components/SignIn.vue"
import NavBar from "@components/NavBar.vue";
import Footer from "@components/StardardFooter.vue";
import CopyService from "@shared/copy/CopyService";

const copy = CopyService.getSharedInstance().copy;

new Vue({
    el: "#signup-app",
    components: {
        SignIn,
        NavBar,
        Footer,
    },
    template: `<div class="page-wrapper">

<div class="signin-wrapper">
<NavBar v-bind:showSignup="false" :showLogin="false" v-bind:redirectOnSignOut="false" :isSticky="false" :forceTransparent="true"/>
    <SignIn :message="message" :title="title"/>
</div>

<Footer/>
</div>`,
    data: {
        message: getQueryParam(QueryParam.MESSAGE),
        title: window.location.pathname.startsWith(PageRoute.LOGIN) ? copy.common.LOG_IN : copy.common.SIGN_UP,
    }
});


function oldMethod() {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("sign_up loaded");
        const $emailContainer = document.getElementById("email-signup");
        const $divider = document.getElementsByClassName("divider").item(0);
        const $loading = document.getElementById("third-party-loading");
        const $welcomeMessage = document.getElementById("welcome-message");
        const $loginContainer = document.getElementById("third-party-logins");
        const $emailInput = document.getElementById("email-input") as HTMLInputElement;

        configureLoginForm("email-signup");


        const $message = document.getElementById("sign-up-message");
        const queryMessage = getQueryParam(QueryParam.MESSAGE);

        if ($message && queryMessage) {
            $message.textContent = decodeURIComponent(queryMessage);
        }

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

        const redirectUrlParam = getQueryParam(QueryParam.REDIRECT_URL);
        console.log("Redirect url param is ", redirectUrlParam);
        let emailLinkRedirectUrl: string = PageRoute.SIGNUP_CONFIRMED;
        if (redirectUrlParam) {
            emailLinkRedirectUrl = `${emailLinkRedirectUrl}?${QueryParam.REDIRECT_URL}=${redirectUrlParam}`
        }

        const ui = getAuthUI();
        const config = getAuthUIConfig({
            signInSuccessPath: redirectUrlParam || PageRoute.JOURNAL_HOME,
            emailLinkSignInPath: redirectUrlParam || PageRoute.JOURNAL_HOME, //Note: email link is currently implemented in auth.js and we don't use firebaseUI
            signInSuccess: (authResult, redirectUrl) => {
                console.log("Redirect URL is", redirectUrl);
                console.log("Letting fbui handle the redirect... just returning true");
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
}


//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}