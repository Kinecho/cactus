// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_is_essential_to_your_happiness.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_is_essential_to_your_happiness loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
