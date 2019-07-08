import "@styles/pages/who_is_a_friend_you_can_always_rely_on.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("who_is_a_friend_you_can_always_rely_on loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
