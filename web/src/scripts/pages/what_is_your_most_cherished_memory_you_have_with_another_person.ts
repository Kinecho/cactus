import "@styles/pages/what_is_your_most_cherished_memory_you_have_with_another_person.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_is_your_most_cherished_memory_you_have_with_another_person loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
