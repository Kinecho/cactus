import "@styles/pages/what_makes_you_feel_self_confident.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_makes_you_feel_self_confident loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
