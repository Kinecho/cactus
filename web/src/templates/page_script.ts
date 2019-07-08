// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/$PAGE_NAME$.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("$PAGE_NAME$ loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
