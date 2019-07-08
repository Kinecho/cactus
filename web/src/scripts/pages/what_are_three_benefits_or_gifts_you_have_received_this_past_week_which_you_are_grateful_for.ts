import "@styles/pages/what_are_three_benefits_or_gifts_you_have_received_this_past_week_which_you_are_grateful_for.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_are_three_benefits_or_gifts_you_have_received_this_past_week_which_you_are_grateful_for loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
