// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/membership.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("membership loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
