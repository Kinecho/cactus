// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/membership.scss"
import {configureSignupForm, setupJumpToForm} from '@web/mailchimp'


document.addEventListener('DOMContentLoaded', () => {
    console.log("membership loaded");
    setupJumpToForm();
    configureSignupForm("email-form-bottom");
});

window.onscroll = function() {
  fixedHero();
};

function fixedHero() {
  if (document.body.scrollTop >= 0 || document.documentElement.scrollTop >= 0) {
    document.getElementById("reflection1").classList.add("animate");
  };
  if (document.body.scrollTop >= 66 || document.documentElement.scrollTop >= 66) {
    document.getElementById("reflection2").classList.add("animate");
  };
  if (document.body.scrollTop >= 132 || document.documentElement.scrollTop >= 132) {
    document.getElementById("reflection3").classList.add("animate");
    document.getElementById("stem2").classList.add("fadeOut");
  };
  if (document.body.scrollTop >= 264 || document.documentElement.scrollTop >= 264) {
    document.getElementById("reflection4").classList.add("animate");
  };
};
