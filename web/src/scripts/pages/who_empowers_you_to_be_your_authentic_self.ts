import "styles/pages/who_empowers_you_to_be_your_authentic_self.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("who_empowers_you_to_be_your_authentic_self loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
