// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_three_things_are_you_looking_forward_to_experiencing_this_week_20190707.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_three_things_are_you_looking_forward_to_experiencing_this_week_20190707 loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
