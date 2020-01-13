// tslint:disable-next-line:no-implicit-dependencies
import Vue from "vue";
import AccountSettings from "@components/AccountSettings.vue"
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";
const logger = new Logger("account_settings.ts");
commonInit();

new Vue({
    el: "#app",
    template: `<AccountSettings/>`,
    components: {
        AccountSettings,
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}