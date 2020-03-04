// @ts-ignore
import MagicLinkAppContinue from "@components/MagicLinkAppContinue.vue"
import Vue from "vue";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

const logger = new Logger("native_app_login_continue.ts");
commonInit();

new Vue({
    el: "#app",
    template: `<MagicLinkAppContinue :link="link"/>`,
    components: {
        MagicLinkAppContinue,
    },
    data() {
        return {
            link: window.location.href
        }
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}