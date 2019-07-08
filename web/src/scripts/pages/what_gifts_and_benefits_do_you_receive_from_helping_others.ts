// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_gifts_and_benefits_do_you_receive_from_helping_others.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_gifts_and_benefits_do_you_receive_from_helping_others loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
