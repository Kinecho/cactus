import "@styles/pages/what_makes_you_cry_tears_of_joy.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_makes_you_cry_tears_of_joy loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
