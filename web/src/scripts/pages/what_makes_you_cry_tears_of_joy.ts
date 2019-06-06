import "styles/pages/what_makes_you_cry_tears_of_joy.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_makes_you_cry_tears_of_joy loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
