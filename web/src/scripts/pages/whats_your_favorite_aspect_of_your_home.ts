import "@styles/pages/whats_your_favorite_aspect_of_your_home.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("whats_your_favorite_aspect_of_your_home loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
