// @ts-ignore
import CoreValuesPage from "@components/CoreValuesPage.vue"
import Vue from "vue";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

const logger = new Logger("CoreValuesPage");
commonInit();

new Vue({
    el: "#app",
    template: `<CoreValuesPage/>`,
    components: {
        CoreValuesPage,
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}