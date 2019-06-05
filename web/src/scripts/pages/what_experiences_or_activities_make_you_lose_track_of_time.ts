import "styles/pages/what_experiences_or_activities_make_you_lose_track_of_time.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("what_experiences_or_activities_make_you_lose_track_of_time loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});
