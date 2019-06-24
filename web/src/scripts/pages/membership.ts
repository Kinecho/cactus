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

    var width = window.innerWidth,
    height = window.innerHeight;

    if (width >= 1140) {
      new ScrollMagic.Scene({
          offset: 1,
          duration: '100%',
      }).setTween(".reflection", 1, {transform: 'translate(0,0)'})
          .addTo(controller);
    } else if (width < 1140) {
      new ScrollMagic.Scene({
          offset: 1,
          duration: '30%',
      }).setTween(".hero .reflection", 1, {transform: 'translate(-30vw,0) scale(0)', opacity: 0})
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
