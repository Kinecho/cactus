// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_are_three_benefits_or_gifts_that_you_received_this_past_week_for_which_you_are_grateful_20190713.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_are_three_benefits_or_gifts_that_you_received_this_past_week_for_which_you_are_grateful_20190713 loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
