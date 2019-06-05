import "styles/pages/$PAGE_NAME$.scss"
import {configureSignupForm} from 'scripts/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("$PAGE_NAME$ loaded");
    configureSignupForm("email-form-bottom");
})
