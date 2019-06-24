// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_makes_dinner_meaningful_to_you.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_makes_dinner_meaningful_to_you loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
