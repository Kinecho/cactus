// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_is_a_meaningful_gift_you_received_from_another_person.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_is_a_meaningful_gift_you_received_from_another_person loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
