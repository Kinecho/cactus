// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_does_the_power_to_choose_provide_you.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_does_the_power_to_choose_provide_you loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
