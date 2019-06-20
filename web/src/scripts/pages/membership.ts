// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/membership.scss"
import * as ScrollMagic from "scrollmagic";
import 'animation.gsap'

const controller = new ScrollMagic.Controller();

document.addEventListener('DOMContentLoaded', () => {
    console.log("membership loaded");
    configureAnimations();

});

function configureAnimations() {
    new ScrollMagic.Scene({
        // triggerElement: "body"
        offset: 1,
        duration: '100%',
    }).setClassToggle("#reflection1", "animate")
        .addTo(controller);

    new ScrollMagic.Scene({
        // offset: 1,
        triggerElement: "section.truck",
        duration: "100%",
    }).setTween(".foodtruck", 0.5, {scale: 2})
        .addTo(controller);

    new ScrollMagic.Scene({
        // triggerElement: "body"
        offset: 66,
        duration: '100%',
    }).setTween("#reflection2", 0.5, {scale: 2.0})
        .addTo(controller);

    new ScrollMagic.Scene({
        // triggerElement: "body"
        offset: 132,
        duration: '100%',
    }).setClassToggle("#reflection3", "animate")
        .addTo(controller);
}

// window.onscroll = function() {
//   fixedHero();
// };

function fixedHero() {
    if (document.body.scrollTop >= 0 || document.documentElement.scrollTop >= 0) {
        document.getElementById("reflection1").classList.add("animate");
    }
    ;
    if (document.body.scrollTop >= 66 || document.documentElement.scrollTop >= 66) {
        document.getElementById("reflection2").classList.add("animate");
    }
    ;
    if (document.body.scrollTop >= 132 || document.documentElement.scrollTop >= 132) {
        document.getElementById("reflection3").classList.add("animate");
        document.getElementById("stem2").classList.add("fadeOut");
    }
    ;
    if (document.body.scrollTop >= 264 || document.documentElement.scrollTop >= 264) {
        document.getElementById("reflection4").classList.add("animate");
    }
    ;
};
