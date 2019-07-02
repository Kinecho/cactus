// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/sign_up_success.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("sign_up_success loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
