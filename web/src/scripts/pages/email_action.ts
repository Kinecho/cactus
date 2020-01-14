import Vue from "vue";
import EmailActionHandler from "@components/EmailActionHandler.vue";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";
const logger = new Logger("email_action.ts");


commonInit();

new Vue({
    el: "#app",
    template: '<EmailAction/>',
    components: {
        EmailAction: EmailActionHandler
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}