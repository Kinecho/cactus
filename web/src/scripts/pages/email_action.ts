import Vue from "vue";
import EmailActionHandler from "@components/EmailActionHandler.vue";

import {commonInit} from "@web/common";

commonInit();

new Vue({
    el: "#app",
    template: '<EmailAction/>',
    components: {
        EmailAction: EmailActionHandler
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}