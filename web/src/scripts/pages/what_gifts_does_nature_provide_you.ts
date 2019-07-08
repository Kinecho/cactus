import "@styles/pages/what_gifts_does_nature_provide_you.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_gifts_does_nature_provide_you loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
