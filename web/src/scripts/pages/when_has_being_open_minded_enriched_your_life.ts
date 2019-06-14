import "@styles/pages/when_has_being_open_minded_enriched_your_life.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("when_has_being_open_minded_enriched_your_life loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
