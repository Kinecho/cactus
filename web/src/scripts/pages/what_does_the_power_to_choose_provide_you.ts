// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_does_the_power_to_choose_provide_you.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_does_the_power_to_choose_provide_you loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
