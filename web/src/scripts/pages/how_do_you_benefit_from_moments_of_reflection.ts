// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/how_do_you_benefit_from_moments_of_reflection.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("how_do_you_benefit_from_moments_of_reflection loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
