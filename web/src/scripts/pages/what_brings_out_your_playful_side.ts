// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_brings_out_your_playful_side.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_brings_out_your_playful_side loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
