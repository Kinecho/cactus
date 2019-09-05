import "@styles/article.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from "@web/mailchimp";
import {init as initAnalytics, startFullstory} from "@web/analytics";
import {getAuth, initializeFirebase} from "@web/firebase";
import {setupNavigation} from "@web/NavigationUtil";

import {commonInit} from "@web/common";


/** start the page **/
initializeArticlePage();

export function initializeArticlePage() {
    commonInit();

    initializeFirebase();
    initAnalytics();
    startFullstory();

    setupNavigation({showSignupButton: true, showLoginButton: true});
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");

    getAuth().onAuthStateChanged(user => {
        if (user) {
            hideEmailSignupFooter();
        } else {
            showEmailSignupFooter()
        }
    })

}

function showEmailSignupFooter() {
    const $emails = document.getElementsByClassName("email");
    if ($emails && $emails.length > 0) {
        const $emailSection = $emails.item(0);
        if ($emailSection) {
            if ($emailSection.parentElement) {
                $emailSection.parentElement.classList.remove("signup-loggedIn");
                $emailSection.parentElement.classList.add("loaded");
            }
        }
    }
}

function hideEmailSignupFooter() {
    const $emails = document.getElementsByClassName("email");
    if ($emails && $emails.length > 0) {
        const $emailSection = $emails.item(0);
        if ($emailSection) {
            if ($emailSection.parentElement) {
                $emailSection.parentElement.classList.add("signup-loggedIn");
                $emailSection.parentElement.classList.add("loaded");
            }
        }
    }
}