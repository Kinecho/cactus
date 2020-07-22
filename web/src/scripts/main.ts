import Vue from "vue";
import App from "@components/App.vue";
import VueRouter from "vue-router";
import router from "@web/router";
import Logger from "@shared/Logger"
import { stringifyJSON } from "@shared/util/ObjectUtil";
import * as Vue2TouchEvents from 'vue2-touch-events'
import * as VueClipboard from 'vue-clipboard2';
import { commonInit } from "@web/common";

const logger = new Logger("main");
commonInit();
Vue.config.errorHandler = (error, vm, info) => {
    // @ts-ignore
    logger.error(`Vue Error in Component "${ vm.name }"`, error);
    logger.error("Vue Error info", stringifyJSON(info));
}
Vue.use(VueRouter);
Vue.use(Vue2TouchEvents as any);
Vue.use(VueClipboard as any);

new Vue({
    el: "#app",
    router,
    render: h => {
        return h(App)
    },
});

if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}