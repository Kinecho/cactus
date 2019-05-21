import "styles/pages/index.scss"
import {configureStripe} from 'scripts/checkout'
import {gtag} from 'scripts/analytics'


// console.log("Config", Config)

// initAnalytics()

document.addEventListener('DOMContentLoaded', function() {
    console.log("index.js loadeds")
    setupFormListener("email-form-top")
    setupFormListener("email-form-bottom")
    configureStripe()

    // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
    // // The Firebase SDK is initialized and available here!
    //
    // firebase.auth().onAuthStateChanged(user => { });
    // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
    // firebase.messaging().requestPermission().then(() => { });
    // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
    //
    // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

    // try {
    //     let app = firebase.app();
    //     let features = ['auth', 'database', 'messaging', 'storage'].filter(feature => typeof app[feature] === 'function');
    //     document.getElementById('load').innerHTML = `Firebase SDK loaded with ${features.join(', ')}`;
    // } catch (e) {
    //     console.error(e);
    //     document.getElementById('load').innerHTML = 'Error loading the Firebase SDK, check the console.';
    // }

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

        alert(`Success! Signed up with email ${emailAddress}`)

        // You must return false to prevent the default form behavior
        return false;
    }


    if (form && form.attachEvent) {
        form.attachEvent("submit", processForm);
    } else {
        form.addEventListener("submit", processForm);
    }
}