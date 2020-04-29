import Logger from "@shared/Logger";
import Vue from "vue";
import App from "@components/App.vue";
import router from "@web/router";

const logger = new Logger("main.ts");

logger.info("Starting single page app");

//self-calling function to create app;
export async function start() {
    new Vue({
        router,

        render: h => h(App),
    }).$mount("#app");
}