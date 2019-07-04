// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/how_has_friendship_enriched_your_life.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("how_has_friendship_enriched_your_life loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
