import "@styles/pages/what_experiences_bring_out_your_harmonious_passions.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_experiences_bring_out_your_harmonious_passions loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
