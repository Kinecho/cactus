// tslint:disable-next-line:no-implicit-dependencies
// import "@styles/pages/referral_program.scss"
import Vue from "vue";
import VueClipboard from 'vue-clipboard2';
import SocialSharing from 'vue-social-sharing';
import ReferralProgram from "@components/ReferralProgram.vue";

Vue.use(VueClipboard);
Vue.use(SocialSharing);

new Vue({
    el: "#app",
    template: `<ReferralProgram/>`,
    components: {
        ReferralProgram,
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}