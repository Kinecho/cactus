import "@styles/pages/what_activity_gives_you_the_most_physical_energy.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_activity_gives_you_the_most_physical_energy loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
