import "@styles/pages/what_provides_you_with_a_sense_of_belonging.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_provides_you_with_a_sense_of_belonging loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
