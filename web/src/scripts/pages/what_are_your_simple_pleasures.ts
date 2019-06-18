// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_are_your_simple_pleasures.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_are_your_simple_pleasures loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
