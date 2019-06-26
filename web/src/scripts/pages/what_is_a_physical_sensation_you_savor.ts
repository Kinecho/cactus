// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_is_a_physical_sensation_you_savor.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_is_a_physical_sensation_you_savor loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
