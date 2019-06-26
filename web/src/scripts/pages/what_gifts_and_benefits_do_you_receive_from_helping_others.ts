// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_gifts_and_benefits_do_you_receive_from_helping_others.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_gifts_and_benefits_do_you_receive_from_helping_others loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
