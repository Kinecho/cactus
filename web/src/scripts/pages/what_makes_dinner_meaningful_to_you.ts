// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_makes_dinner_meaningful_to_you.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_makes_dinner_meaningful_to_you loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
