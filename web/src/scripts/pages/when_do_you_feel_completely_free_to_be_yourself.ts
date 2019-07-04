// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/when_do_you_feel_completely_free_to_be_yourself.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("when_do_you_feel_completely_free_to_be_yourself loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
