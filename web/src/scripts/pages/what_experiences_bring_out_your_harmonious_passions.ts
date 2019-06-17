import "@styles/pages/what_experiences_bring_out_your_harmonious_passions.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_experiences_bring_out_your_harmonious_passions loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
