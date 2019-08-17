import "@styles/pages/values_home.scss"
import Vue from "vue";
import ValuesHome from "@components/ValuesHome.vue";

new Vue({
    el: "#app",
    template: `<ValuesHome/>`,
    components: {ValuesHome: ValuesHome}
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}