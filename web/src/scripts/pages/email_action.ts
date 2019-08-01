// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/email_action.scss"
import Vue from "vue";
import EmailActionHandler from "@components/EmailActionHandler.vue";
import {configureDirectives} from "@web/vueDirectives";

configureDirectives();
new Vue({
    el: "#app",
    template: '<EmailAction/>',
    components: {
        EmailAction: EmailActionHandler
    }
});