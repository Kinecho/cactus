import "styles/pages/index.scss"
import {Config} from "@web/config"
import {gtag} from '@web/analytics'
import * as firebase from "firebase/app"
import "firebase/functions"
import {configureSignupForm, submitEmail} from '@web/mailchimp'

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
    configureSignupForm("sign-up-top");
    configureSignupForm("email-form-bottom");
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

