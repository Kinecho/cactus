import "@styles/pages/when_do_you_feel_deep_satisfaction.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("when_do_you_feel_deep_satisfaction loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
