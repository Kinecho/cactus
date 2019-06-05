import "styles/pages/$PAGE_NAME$.scss"
import {configureSignupForm, setupJumpToForm} from 'scripts/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("$PAGE_NAME$ loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
})
