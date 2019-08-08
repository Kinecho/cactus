// tslint:disable-next-line:no-implicit-dependencies
// import "@styles/pages/referral_program.scss"
import Vue from "vue";
import VueClipboard from 'vue-clipboard2';
import ReferralProgram from "@components/ReferralProgram.vue"

Vue.use(VueClipboard);

new Vue({
    el: "#app",
    template: `<ReferralProgram/>`,
    components: {
        ReferralProgram,
    }
});

