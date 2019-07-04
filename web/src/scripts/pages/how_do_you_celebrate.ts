import "@styles/pages/how_do_you_celebrate.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from "@web/mailchimp";

document.addEventListener('DOMContentLoaded', function() {
    console.log("How do you celebrate? Page Loaded");
    configureMailchimpSignupForm("signup-form-bottom");
    setupJumpToForm();
});
