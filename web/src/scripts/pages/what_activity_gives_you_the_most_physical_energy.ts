import "@styles/pages/what_activity_gives_you_the_most_physical_energy.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_activity_gives_you_the_most_physical_energy loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
