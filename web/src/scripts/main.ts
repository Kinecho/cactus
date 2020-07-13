import Vue, { PluginFunction, PluginObject } from "vue";
import App from "@components/App.vue";
import router from "@web/router";
import VueRouter from "vue-router";
import CactusMemberService from "@web/services/CactusMemberService";
import Logger from "@shared/Logger"
import { stringifyJSON } from "@shared/util/ObjectUtil";
import * as Vue2TouchEvents from 'vue2-touch-events'
import * as VueClipboard from 'vue-clipboard2';

const logger = new Logger("main");
Vue.config.errorHandler = (error, vm, info) => {
    // @ts-ignore
    logger.error(`Vue Error in Component "${ vm.name }"`, error);
    logger.error("Vue Error info", stringifyJSON(info));
}
Vue.use(VueRouter);
Vue.use(Vue2TouchEvents as any);
Vue.use(VueClipboard as any);

export async function start() {
    const currentMember = await CactusMemberService.sharedInstance.getCurrentMember()
    logger.info("Member initialized - is logged in = ", !!currentMember)

    new Vue({
        router,
        render: h => h(App),
    }).$mount("#app");
}