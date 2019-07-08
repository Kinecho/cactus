// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/journal.scss"
// @ts-ignore
import * as ScrollMagic from "scrollmagic";
import 'animation.gsap';
import 'ScrollToPlugin';
import {TweenMax, Power1} from "gsap";
const controller = new ScrollMagic.Controller();

document.addEventListener('DOMContentLoaded', () => {
    console.log("journal loaded");

    configureLearnMoreScroll();
    configureAnimations();
});

function configureLearnMoreScroll(){

    controller.scrollTo((newpos: any) => {
        const width = window.innerWidth;

        let duration = 1.0;
        let autoKill = true;
        if (width < 1140){
            duration = 0.25;
            autoKill = false;
        }

        TweenMax.to(window, duration, {scrollTo: {y: newpos, autoKill}, ease: Power1.easeIn});
    });

    const learnMore = document.getElementById("learnMoreTop");
    if (learnMore){
        learnMore.addEventListener("click", (e) => {
            e.preventDefault();
            controller.scrollTo("#learnMore");
        })
    }

}

function configureAnimations() {

    const width = window.innerWidth;

    if (width >= 1140) {
      new ScrollMagic.Scene({
          offset: 1,
          duration: '100%',
      }).setTween(".reflection", 1, {transform: 'translate(0,0)'})
          .addTo(controller);
    }

    if (width >= 1140) {
      new ScrollMagic.Scene({
          offset: 1,
          duration: "100%",
      }).setTween(".hero", 1, {backgroundColor: 'white'})
          .addTo(controller);
    }

    if (width >= 1140) {
      new ScrollMagic.Scene({
          offset: 1,
          duration: '100%',
      }).setTween("#pinkBlob", 1, {transform: 'translate(81vw, 140vh)'})
          .addTo(controller);
    } else if (width < 1140) {
      new ScrollMagic.Scene({
          offset: 1,
          duration: '100%',
      }).setTween("#pinkBlob", 1, {transform: 'translate(81vw, 60vh)'})
          .addTo(controller);
    }

    new ScrollMagic.Scene({
        offset: 1,
        duration: '100%',
    }).setTween("#yellowBlob2", 1, {transform: 'translate(-7vw, 99vh) rotate(57deg)'})
        .addTo(controller);

    if (width >= 1140) {
      new ScrollMagic.Scene({
          offset: 1,
          duration: '100%',
      }).setTween("#greenBlob", 1, {transform: 'translate(-12vw, 110vh)'})
          .addTo(controller);
    } else if (width < 1140) {
      new ScrollMagic.Scene({
          offset: 1,
          duration: '100%',
      }).setTween("#greenBlob", 1, {transform: 'translate(-24vw, 65vh)'})
          .addTo(controller);
    }
}
