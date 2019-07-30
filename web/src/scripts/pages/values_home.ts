// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/values_home.scss"
import Vue from "vue";
import ValuesHome from "@components/ValuesHome.vue";
import {configureDirectives} from "@web/vueDirectives";

configureDirectives();

new Vue({
    el: "#app",
    template: `<ValuesHome/>`,
    components: {ValuesHome: ValuesHome}
});