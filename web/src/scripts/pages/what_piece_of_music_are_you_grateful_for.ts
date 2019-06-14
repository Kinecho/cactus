import "@styles/pages/what_piece_of_music_are_you_grateful_for.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_piece_of_music_are_you_grateful_for loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
