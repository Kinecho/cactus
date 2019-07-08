// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_do_you_enjoy_and_savor_about_your_daily_work.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_do_you_enjoy_and_savor_about_your_daily_work loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
