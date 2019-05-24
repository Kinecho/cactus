import "styles/pages/index.scss"
import {configureStripe} from '@web/checkout'
import {Config} from "@web/config"
import {gtag} from '@web/analytics'
import * as firebase from "firebase/app"
import "firebase/functions"
import {submitEmail} from '@web/mailchimp'
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
    addModalCloseListener()

});


function addModalCloseListener(){
    let buttons = <HTMLCollectionOf<HTMLButtonElement>> document.getElementsByClassName("modal-close");
    Array.from(buttons).forEach(button => {
        button.addEventListener("click", () => {
            let modalId = button.dataset.for;
            let modal = <HTMLDivElement> document.getElementById(modalId);
            modal.classList.add("hidden");
            modal.classList.remove("open");
        })
    })
}

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

        let modalDiv = <HTMLDivElement>document.getElementById("signup-success-modal");

        button.disabled = true;

        if (!emailInput) {
            //handle error
            console.warn("no email input was found");
            gtag("event", "exception", {
                description: "email input field was found for form " + formId,
                fatal: false
            });

            alert("Please enter an email");
            return false;
        }

        let emailAddress = emailInput.value || "";
        emailAddress = emailAddress.trim().toLowerCase();
        console.log("submitting email", emailAddress);


        gtag('event', 'email_signup_success', {
            event_category: "email_signup",
            event_label: `${formId} - ${emailAddress}`
        });

        submitEmail(emailAddress, null).then(response => {
            // alert(`Success! Signed up with email ${emailAddress}`)
            button.disabled = false;
            if (errorDiv && errorDiv.classList.contains("hidden")){
                errorDiv.classList.add("hidden")
            }
            modalDiv.classList.remove("hidden");
            modalDiv.classList.add("open")


        }).catch(error => {
            alert("error signing up");
            if (errorDiv){
                errorDiv.classList.remove("hidden")
            }

        });

        // You must return false to prevent the default form behavior
        return false;
    }

    form.addEventListener("submit", processForm);
}

