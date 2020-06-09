import Vue from "vue";
import App from "@components/App.vue";
import router from "@web/router";
import VueRouter from "vue-router";
import CactusMemberService from "@web/services/CactusMemberService";
import Logger from "@shared/Logger"

const logger = new Logger("main");

Vue.use(VueRouter);

//self-calling function to create app;
export async function start() {
    const currentMember = await CactusMemberService.sharedInstance.getCurrentMember()
    logger.info("Member initialized - is logged in = ", !!currentMember)

    new Vue({
        router,
        render: h => h(App),
    }).$mount("#app");
}