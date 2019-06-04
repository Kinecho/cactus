import "styles/pages/index.scss"
import {Config} from "@web/config"
import {gtag} from '@web/analytics'
import * as firebase from "firebase/app"
import "firebase/functions"
import {submitEmail} from '@web/mailchimp'
import {addModal, getQueryParam, showModal, validateEmail} from "@web/util";
import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {QueryParam} from "@web/queryParams";

document.addEventListener('DOMContentLoaded', function() {
    console.log("index.js loaded");

    try {
        let app = firebase.initializeApp(Config.firebase);
            let features = ['auth', 'database', 'messaging', 'storage', 'functions'].filter(feature => typeof app[feature] === 'function');
            console.log(`Firebase SDK loaded with ${features.join(', ')}`)
    } catch (e) {
        console.error('FAILED TO GET FIREBASE', e);
        document.getElementById('load').innerHTML = 'Error loading the Firebase SDK, check the console.';
    }
    setupFormListener("sign-up-top");
    setupFormListener("email-form-bottom");
    setupJumpToForm();
});


function setupJumpToForm(){
    let buttons = <HTMLCollectionOf<HTMLButtonElement>> document.getElementsByClassName("jump-to-form");

    Array.from(buttons).forEach(button => {
        if (!button){
            return
        }

        let scrollToId = button.dataset.scrollTo;
        let doFocus = Boolean(button.dataset.focusForm);

        console.log("scrolling to", scrollToId);
        let content = document.getElementById(scrollToId);

        button.addEventListener("click", () => {
            gtag("event", "scroll_to", {formId: scrollToId});
            content.scrollIntoView();
            if (doFocus){
                let form = document.getElementById(button.dataset.focusForm);
                if (form){
                    let input = form.getElementsByTagName("input").item(0);
                    if (input) {
                        input.focus()
                    }
                }
            }
        })
    })
}

function setupFormListener(formId){
    let form = document.getElementById(formId);


    if (!form){
        console.error("no form found in document for id", formId)
        gtag("event", "exception", {
            description: "no form found on page for formId" + formId,
            fatal: false
        });
        return
    }

    async function processForm(e) {
        if (e.preventDefault) e.preventDefault();
        /* do what you want with the form */
        console.log("form submitted", formId);

        gtag('event', 'email_signup_clicked', {
            event_category: "email_signup",
            event_label: `${formId}`
        });

        let emailInput = <HTMLInputElement>form.children.namedItem("email");
        let button = <HTMLButtonElement>form.children.namedItem("submit");
        let errors = <HTMLCollection>form.getElementsByClassName("error")
        let errorDiv:HTMLDivElement = null;
        if (errors && errors.length > 0){
            errorDiv = <HTMLDivElement>errors.item(0)
        }

        function showError(message: string){
            if (errorDiv){
                errorDiv.innerText = message;
                errorDiv.classList.remove("hidden")
            }
        }

        function hideError(){
            if (errorDiv){
                errorDiv.classList.add("hidden")
            }
        }

        if (!emailInput) {
            //handle error
            console.warn("no email input was found");
            gtag("event", "exception", {
                description: "email input field was found for form " + formId,
                fatal: false
            });

            showError("Oops, we are unable to process your request. Please try again later");
            return false;
        }

        let emailAddress = emailInput.value || "";
        emailAddress = emailAddress.trim().toLowerCase();
        console.log("submitting email", emailAddress);


        if (!validateEmail(emailAddress)){
            if (emailAddress.trim().length === 0) {
                showError("Please enter an email address.")
            } else {
                showError(`"${emailAddress}" is not a valid email.`);
            }
            return false
        }

        button.disabled = true;

        try {

            let subscription = new SubscriptionRequest(emailAddress);
            subscription.subscriptionLocation = {page: "home", formId};

            let referredParam = getQueryParam(QueryParam.SENT_TO_EMAIL_ADDRESS);
            if (referredParam){
                subscription.referredByEmail = referredParam;
            }

            const signupResult = await submitEmail(subscription);

            if (signupResult.success){
                let modalId = "signup-success-modal";
                hideError();
                addModal(modalId, {title: "Success!", message: `Look for the confirmation email in your ${emailAddress} inbox.`});
                gtag('event', 'email_signup_success', {
                    event_category: "email_signup",
                    event_label: `${formId}`
                });
                showModal(modalId);


                emailInput.value = "";
            } else if (signupResult.error){
                gtag('event', 'email_signup_error', {
                    event_category: "email_signup",
                    event_label: `${formId}`
                });
                showError(signupResult.error.friendlyMessage || "Sorry, it looks like we're having issues. Please try again later.")
            } else {

                gtag('event', 'email_signup_error', {
                    event_category: "email_signup",
                    event_label: `${formId}`
                });
                showError("Sorry, it looks like we're having issues. Please try again later");
            }
        } catch (error){
            console.error("failed to process form", error);
            showError("Sorry, it looks like we're having issues.");
        } finally {
            button.disabled = false
        }

        // You must return false to prevent the default form behavior
        return false;
    }

    form.addEventListener("submit", processForm);
}
