import "@styles/pages/what_brings_you_joy.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_brings_you_joy loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
