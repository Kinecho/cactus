import "@styles/pages/values_home.scss"
import Vue from "vue";
import ValuesHome from "@components/ValuesHome.vue";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";
const logger = new Logger("values_home.ts");
commonInit();
new Vue({
    el: "#app",
    template: `<ValuesHome/>`,
    components: {ValuesHome: ValuesHome}
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}