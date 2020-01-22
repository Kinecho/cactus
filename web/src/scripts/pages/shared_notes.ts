// @ts-ignore
import SharedNotesPage from "@components/SharedNotesPage.vue"
import Vue from "vue";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

const logger = new Logger("SharedNotesPage");
commonInit();

new Vue({
    el: "#app",
    template: `<SharedNotesPage/>`,
    components: {
        SharedNotesPage,
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}