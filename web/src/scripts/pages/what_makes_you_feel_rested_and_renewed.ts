import "@styles/pages/what_makes_you_feel_rested_and_renewed.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_makes_you_feel_rested_and_renewed loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
