// tslint:disable-next-line:no-implicit-dependencies
import Vue from "vue";
import VueClipboard from 'vue-clipboard2';
import SocialSharing from 'vue-social-sharing';
import SocialHome from "@components/SocialHome.vue";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

const logger = new Logger("social_home.ts");
commonInit();

Vue.use(VueClipboard);
Vue.use(SocialSharing);

new Vue({
    el: "#app",
    template: `<SocialHome/>`,
    components: {
        SocialHome,
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}