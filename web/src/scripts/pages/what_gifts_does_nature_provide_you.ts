import "@styles/pages/what_gifts_does_nature_provide_you.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_gifts_does_nature_provide_you loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
