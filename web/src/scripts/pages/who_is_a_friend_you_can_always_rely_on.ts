import "@styles/pages/who_is_a_friend_you_can_always_rely_on.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("who_is_a_friend_you_can_always_rely_on loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
