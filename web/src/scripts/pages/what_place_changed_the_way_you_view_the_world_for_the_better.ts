// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_place_changed_the_way_you_view_the_world_for_the_better.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_place_changed_the_way_you_view_the_world_for_the_better loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
