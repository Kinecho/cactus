import "@styles/pages/when_has_being_open_minded_enriched_your_life.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("when_has_being_open_minded_enriched_your_life loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
