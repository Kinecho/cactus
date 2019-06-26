// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_do_you_love_about_your_morning_rituals.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_do_you_love_about_your_morning_rituals loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
