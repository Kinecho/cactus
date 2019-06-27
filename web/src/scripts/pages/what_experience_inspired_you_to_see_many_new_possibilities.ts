// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_experience_inspired_you_to_see_many_new_possibilities.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_experience_inspired_you_to_see_many_new_possibilities loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
