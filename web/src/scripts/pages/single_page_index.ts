// @ts-ignore
import App from "@components/App.vue"
import Vue from "vue";
import { commonInit } from "@web/common";
import Logger from "@shared/Logger";
import { start } from "@web/main";

const logger = new Logger("App");
commonInit();

(async () => await start())();

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}