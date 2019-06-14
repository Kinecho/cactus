import "@styles/pages/index.scss"
import {Config} from "@web/config"
import * as firebase from "firebase/app"
import "firebase/functions"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'

document.addEventListener('DOMContentLoaded', function () {
    console.log("index.js loaded");

    try {
        const app = firebase.initializeApp(Config.firebase);
        const features = ['auth', 'database', 'messaging', 'storage', 'functions'].filter(feature => typeof app[feature] === 'function');
        console.log(`Firebase SDK loaded with ${features.join(', ')}`)
    } catch (e) {
        console.error('FAILED TO GET FIREBASE', e);
        document.getElementById('load').innerHTML = 'Error loading the Firebase SDK, check the console.';
    }
    configureSignupForm("sign-up-top");
    configureSignupForm("email-form-bottom");
    setupJumpToForm();
});

