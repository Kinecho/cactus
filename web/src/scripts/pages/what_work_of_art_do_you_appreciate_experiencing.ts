// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_work_of_art_do_you_appreciate_experiencing.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_work_of_art_do_you_appreciate_experiencing loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
