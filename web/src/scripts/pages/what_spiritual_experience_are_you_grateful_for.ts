import "@styles/pages/what_spiritual_experience_are_you_grateful_for.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from "@web/mailchimp";

document.addEventListener('DOMContentLoaded', function() {
    console.log("What spiritual experience are you grateful for? Page Loaded");
    configureMailchimpSignupForm("email-form-bottom");
    setupJumpToForm();
});
