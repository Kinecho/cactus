import Vue from "vue";
import App from "@components/App.vue";
import router from "@web/router";
import VueRouter from "vue-router";
import CactusMemberService from "@web/services/CactusMemberService";
import Logger from "@shared/Logger"
import { stringifyJSON } from "@shared/util/ObjectUtil";
import Vue2TouchEvents from 'vue2-touch-events'

const logger = new Logger("main");

Vue.config.errorHandler = (error, vm, info) => {
    // @ts-ignore
    logger.error(`Vue Error in Component "${vm.name}"`, error);
    logger.error("Vue Error info", stringifyJSON(info));
}

Vue.use(VueRouter);
Vue.use(Vue2TouchEvents);

//self-calling function to create app;
export async function start() {
    const currentMember = await CactusMemberService.sharedInstance.getCurrentMember()
    logger.info("Member initialized - is logged in = ", !!currentMember)

    new Vue({
        router,
        render: h => h(App),
    }).$mount("#app");
}