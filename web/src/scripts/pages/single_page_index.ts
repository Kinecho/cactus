import '@styles/common.scss';
import App from "@components/App.vue"
import { commonInit } from "@web/common";
import Logger from "@shared/Logger";
import Vue from "vue";

const logger = new Logger("App");
commonInit();

new Vue({el: "#app"});//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}