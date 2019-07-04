import "@styles/pages/what_do_you_appreciate_most_about_your_best_friend.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_do_you_appreciate_most_about_your_best_friend loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
