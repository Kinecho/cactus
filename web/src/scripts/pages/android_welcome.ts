// @ts-ignore
import AndroidWelcome from "@components/AndroidWelcome.vue"
import Vue from "vue";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

const logger = new Logger("AndroidWelcome");
commonInit();

new Vue({
    el: "#app",
    template: `<AndroidWelcome/>`,
    components: {
        AndroidWelcome,
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}
