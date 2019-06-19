// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/membership.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("membership loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});

// window.onscroll = function() {moveLogo()};
//
// function moveLogo() {
//   if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
//     document.getElementById("id1").className = "test";
//   } else {
//     document.getElementById("id1").className = "";
//   }
// }
