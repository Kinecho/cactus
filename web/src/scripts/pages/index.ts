import "styles/pages/index.scss"
import {configureStripe} from '@web/checkout'
import {Config} from "@web/config"
import {gtag} from '@web/analytics'
import * as firebase from "firebase/app"
import "firebase/functions"
import {submitEmail} from '@web/mailchimp'
import {validateEmail, addModal, showModal} from "@web/util";
// import functions from "firebase-functions"

// console.log("Config", Config)

// initAnalytics()

document.addEventListener('DOMContentLoaded', function() {
    console.log("index.js loaded");

    try {
        let app = firebase.initializeApp(Config.firebase);
            let features = ['auth', 'database', 'messaging', 'storage', 'functions'].filter(feature => typeof app[feature] === 'function');
            console.log(`Firebase SDK loaded with ${features.join(', ')}`)
            // document.getElementById('load').innerHTML = `Firebase SDK loaded with ${features.join(', ')}`;
    } catch (e) {
        console.error('FAILED TO GET FIREBASE', e);
        document.getElementById('load').innerHTML = 'Error loading the Firebase SDK, check the console.';
    }
    setupFormListener("sign-up-top");
    setupFormListener("email-form-bottom");
    configureStripe();
    // addModalCloseListener()

});


//listen for email form submissions
// document.documentElement.addEventListener("click", (event) => {
//     // event.target.
//     if (!event.target.matches('.email-submit-button')) return;
//     console.log("email submit button pressed")
//
//     // alert("Hello javascript!")
// })


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

    function processForm(e) {
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

            if (errorDiv){
                showError(`"${emailAddress}" is not a valid email.`);
            }
            return false
        }

        button.disabled = true;

        gtag('event', 'email_signup_success', {
            event_category: "email_signup",
            event_label: `${formId} - ${emailAddress}`
        });

        let modalId = "signup-success-modal";

        addModal(modalId, {title: "Success!", message: `Check your inbox for ${emailAddress}`});

        submitEmail(emailAddress, null).then(response => {
            // alert(`Success! Signed up with email ${emailAddress}`)
            button.disabled = false;
            hideError();
            showModal(modalId);

            emailInput.value = "";

        }).catch(error => {
            showError("Sorry, it looks like we're having issues.");
        });

        // You must return false to prevent the default form behavior
        return false;
    }

    form.addEventListener("submit", processForm);
}

