// @ts-ignore
import SponsorPage from "@components/SponsorPage.vue"
import Vue from "vue";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

const logger = new Logger("SponsorPage");
commonInit();

new Vue({
    el: "#app",
    template: `<SponsorPage/>`,
    components: {
        SponsorPage,
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}