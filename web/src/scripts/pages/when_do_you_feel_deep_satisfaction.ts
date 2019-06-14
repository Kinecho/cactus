import "@styles/pages/when_do_you_feel_deep_satisfaction.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("when_do_you_feel_deep_satisfaction loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
