// @ts-ignore
import "@styles/pages/android_welcome.scss"
import AndroidWelcome from "@components/AndroidWelcome.vue"
import Vue from "vue";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

const logger = new Logger("AndroidWelcome");
commonInit();

new Vue({
    el: "#app",
    components: {
        AndroidWelcome,
    },
    template: `        
        <AndroidWelcome/>
    `,
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}
