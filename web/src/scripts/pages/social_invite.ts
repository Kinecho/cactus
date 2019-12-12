// tslint:disable-next-line:no-implicit-dependencies
import Vue from "vue";
import VueClipboard from 'vue-clipboard2';
import SocialSharing from 'vue-social-sharing';
import SocialInvite from "@components/SocialInvite.vue";

import {commonInit} from "@web/common";

commonInit();

Vue.use(VueClipboard);
Vue.use(SocialSharing);

new Vue({
    el: "#app",
    template: `<SocialInvite/>`,
    components: {
        SocialInvite,
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}