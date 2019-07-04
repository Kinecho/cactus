import "@styles/pages/what_makes_you_feel_self_confident.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_makes_you_feel_self_confident loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
