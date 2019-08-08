// tslint:disable-next-line:no-implicit-dependencies
// import "@styles/pages/referral_program.scss"
import Vue from "vue";
import VueClipboard from 'vue-clipboard2';
import SocialSharing from 'vue-social-sharing';
import ReferralProgram from "@components/ReferralProgram.vue";
import { library } from '@fortawesome/fontawesome-svg-core';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faTwitter, faFacebook } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

Vue.use(VueClipboard);
Vue.use(SocialSharing);

library.add(faEnvelope);
library.add(faTwitter, faFacebook);

Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.config.productionTip = false

new Vue({
    el: "#app",
    template: `<ReferralProgram/>`,
    components: {
        ReferralProgram,
    }
});

