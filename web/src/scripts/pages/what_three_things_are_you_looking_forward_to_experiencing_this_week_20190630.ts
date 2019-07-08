// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_three_things_are_you_looking_forward_to_experiencing_this_week_20190630.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_three_things_are_you_looking_forward_to_experiencing_this_week_20190630 loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
