import "@styles/pages/values_home.scss"
import Vue from "vue";
import ValuesHome from "@components/ValuesHome.vue";

new Vue({
    el: "#app",
    template: `<ValuesHome/>`,
    components: {ValuesHome: ValuesHome}
});
