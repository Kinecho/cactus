// tslint:disable-next-line:no-implicit-dependencies
import Vue from "vue";
import VueClipboard from 'vue-clipboard2';
import SocialSharing from 'vue-social-sharing';
import SocialActivity from "@components/SocialActivity.vue";

import {commonInit} from "@web/common";

commonInit();

Vue.use(VueClipboard);
Vue.use(SocialSharing);

new Vue({
    el: "#app",
    template: `<SocialActivity/>`,
    components: {
        SocialActivity,
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}