// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/what_film_television_series_or_work_of_theater_allows_you_to_think_and_feel_in_new_ways.scss"
import {configureMailchimpSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_film_television_series_or_work_of_theater_allows_you_to_think_and_feel_in_new_ways loaded");
    setupJumpToForm();
    configureMailchimpSignupForm("email-form-bottom");
});
