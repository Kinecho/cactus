// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_have_you_pursued_where_the_journey_became_the_reward.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_have_you_pursued_where_the_journey_became_the_reward loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
