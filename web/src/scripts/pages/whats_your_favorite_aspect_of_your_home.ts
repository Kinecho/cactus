import "@styles/pages/whats_your_favorite_aspect_of_your_home.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("whats_your_favorite_aspect_of_your_home loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
