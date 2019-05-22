import "styles/pages/index.scss"
import {configureStripe} from 'scripts/checkout'
import {Config} from "scripts/config"
import {gtag} from 'scripts/analytics'
import * as firebase from "firebase/app"
import "firebase/functions"
import {submitEmail} from 'scripts/mailchimp'
// import functions from "firebase-functions"

// console.log("Config", Config)

// initAnalytics()

document.addEventListener('DOMContentLoaded', function() {
    console.log("index.js loadeds")



    // firebase.auth().onAuthStateChanged(user => { });
    // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
    // firebase.messaging().requestPermission().then(() => { });
    // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });


    try {
        let app = firebase.initializeApp(Config.firebase);
            let features = ['auth', 'database', 'messaging', 'storage', 'functions'].filter(feature => typeof app[feature] === 'function');
            console.log(`Firebase SDK loaded with ${features.join(', ')}`)
            // document.getElementById('load').innerHTML = `Firebase SDK loaded with ${features.join(', ')}`;
    } catch (e) {
        console.error('FAILED TO GET FIREBASE', e);
        document.getElementById('load').innerHTML = 'Error loading the Firebase SDK, check the console.';
    }

    setupFormListener("email-form-top")
    setupFormListener("email-form-bottom")
    configureStripe()

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
        })
        return
    }

    function processForm(e) {
        if (e.preventDefault) e.preventDefault();
        /* do what you want with the form */
        console.log("form submitted", formId)

        gtag('event', 'email_signup_clicked', {
            event_category: "email_signup",
            event_label: `${formId}`
        });

        let emailInput = form.children.namedItem("email")
        if (!emailInput) {
            //handle error
            console.warn("no email input was found")
            gtag("event", "exception", {
                description: "email input field was found for form " + formId,
                fatal: false
            })

            alert("Please enter an email")
            return false;
        }

        let emailAddress = emailInput.value || ""
        emailAddress = emailAddress.trim().toLowerCase()
        console.log("submitting email", emailAddress)


        gtag('event', 'email_signup_success', {
            event_category: "email_signup",
            event_label: `${formId} - ${emailAddress}`
        });

        submitEmail({email: emailAddress, referrerEmail: null}).then(response => {
            alert(`Success! Signed up with email ${emailAddress}`)
        }).catch(error => {
            alert("error signing up")
        })

        // You must return false to prevent the default form behavior
        return false;
    }


    if (form && form.attachEvent) {
        form.attachEvent("submit", processForm);
    } else {
        form.addEventListener("submit", processForm);
    }
}