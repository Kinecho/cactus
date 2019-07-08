import "@styles/pages/what_actions_do_you_take_to_show_someone_you_love_them.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_actions_do_you_take_to_show_someone_you_love_them loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
