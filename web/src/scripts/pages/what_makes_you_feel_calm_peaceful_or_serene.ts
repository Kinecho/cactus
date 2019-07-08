// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_makes_you_feel_calm_peaceful_or_serene.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_makes_you_feel_calm_peaceful_or_serene loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
