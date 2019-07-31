// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/values_home.scss"
// @ts-ignore
import Vue from "vue";
import ValuesHome from "@components/ValuesHome.vue";
import {configureDirectives} from "@web/vueDirectives";
//import * as ScrollMagic from "scrollmagic";
import {TweenMax, Power1} from "gsap";
import 'animation.gsap';
// @ts-ignore
import {ScrollToPlugin} from 'gsap/all';

configureDirectives();

new Vue({
    el: "#app",
    template: `<ValuesHome/>`,
    components: {ValuesHome: ValuesHome}
});

//const controller = new ScrollMagic.Controller();

//need to reference the plugin here so it doesn't get dropped by webpack during tree shaking
const plugins = [ScrollToPlugin, TweenMax, Power1];
console.debug("using plugins", plugins);

document.addEventListener('DOMContentLoaded', () => {
    console.log("values loaded");

    //configureAnimations();
});

// function configureAnimations() {
//
//     const width = window.innerWidth;
//
//     if (width >= 1140) {
//         new ScrollMagic.Scene({
//             offset: 1,
//             duration: '100%',
//         }).setTween("#pinkBlob", 1, {transform: 'translate(0, 0) rotate(15deg)'})
//             .addTo(controller);
//     } else if (width < 1140) {
//         new ScrollMagic.Scene({
//             offset: 1,
//             duration: '100%',
//         }).setTween("#pinkBlob", 1, {transform: 'translate(81vw, 60vh)'})
//             .addTo(controller);
//     }
//
//     new ScrollMagic.Scene({
//         offset: 1,
//         duration: '500%',
//     }).setTween("#yellowBlob1", 1, {transform: 'translate(-7vw, 99vh) rotate(15deg)'})
//         .addTo(controller);
//
//     if (width >= 1140) {
//         new ScrollMagic.Scene({
//             offset: 1,
//             duration: '500%',
//         }).setTween("#greenBlob", 1, {transform: 'translate(13vw, -39vh)'})
//             .addTo(controller);
//     } else if (width < 1140) {
//         new ScrollMagic.Scene({
//             offset: 1,
//             duration: '100%',
//         }).setTween("#greenBlob", 1, {transform: 'translate(-24vw, 65vh)'})
//             .addTo(controller);
//     }
// }
