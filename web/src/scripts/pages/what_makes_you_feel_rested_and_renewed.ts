import "@styles/pages/what_makes_you_feel_rested_and_renewed.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_makes_you_feel_rested_and_renewed loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
