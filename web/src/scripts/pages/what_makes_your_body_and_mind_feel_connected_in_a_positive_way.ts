import "@styles/pages/what_makes_your_body_and_mind_feel_connected_in_a_positive_way.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_makes_your_body_and_mind_feel_connected_in_a_positive_way loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
