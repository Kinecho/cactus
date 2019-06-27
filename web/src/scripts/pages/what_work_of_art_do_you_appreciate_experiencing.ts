// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_work_of_art_do_you_appreciate_experiencing.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_work_of_art_do_you_appreciate_experiencing loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
