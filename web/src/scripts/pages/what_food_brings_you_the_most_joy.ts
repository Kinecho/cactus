import "@styles/pages/what_food_brings_you_the_most_joy.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_food_brings_you_the_most_joy loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
