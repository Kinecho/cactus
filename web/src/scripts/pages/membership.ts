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
        offset: 1,
        duration: "100%",
    }).setTween(".hero", 1, {backgroundColor: 'white'})
        .addTo(controller);

    new ScrollMagic.Scene({
        offset: 1,
        duration: '100%',
    }).setTween("#pinkBlob", 1, {transform: 'translate(81vw, 140vh)'})
        .addTo(controller);

    new ScrollMagic.Scene({
        offset: 1,
        duration: '100%',
    }).setTween("#yellowBlob2", 1, {transform: 'translate(-7vw, 99vh) rotate(57deg)'})
        .addTo(controller);

    new ScrollMagic.Scene({
        offset: 1,
        duration: '100%',
    }).setTween("#greenBlob", 1, {transform: 'translate(-12vw, 110vh)'})
        .addTo(controller);

    new ScrollMagic.Scene({
        offset: 1,
        duration: '100%',
    }).setTween("#reflection1", 1, {transform: 'translate(0,0)'})
        .addTo(controller);

    new ScrollMagic.Scene({
        offset: 1,
        duration: '100%',
    }).setTween("#reflection2", 1, {transform: 'translate(0,0)'})
        .addTo(controller);

    new ScrollMagic.Scene({
        offset: 1,
        duration: '100%',
    }).setTween("#reflection3", 1, {transform: 'translate(0,0)'})
        .addTo(controller);

    new ScrollMagic.Scene({
        offset: 1,
        duration: '100%',
    }).setTween("#reflection4", 1, {transform: 'translate(0,0)'})
        .addTo(controller);
}
