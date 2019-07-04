// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_is_a_physical_sensation_you_savor.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_is_a_physical_sensation_you_savor loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
