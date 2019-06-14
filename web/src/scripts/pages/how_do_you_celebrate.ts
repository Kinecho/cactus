import "@styles/pages/how_do_you_celebrate.scss"
import {configureSignupForm, setupJumpToForm} from "@web/mailchimp";

document.addEventListener('DOMContentLoaded', function() {
    console.log("How do you celebrate? Page Loaded");
    configureSignupForm("signup-form-bottom");
    setupJumpToForm();
});
