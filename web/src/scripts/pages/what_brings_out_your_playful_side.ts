// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_brings_out_your_playful_side.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_brings_out_your_playful_side loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
