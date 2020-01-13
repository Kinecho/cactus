// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/unsubscribe_confirmed.scss"
import {commonInit} from "@web/common";
import UnsubPage from "@components/UnsubscribeConfirmedPage.vue";
import Vue from "vue";
import Logger from "@shared/Logger";

const logger = new Logger("unsubscribe_confirmed.ts");
commonInit();

new Vue({
    template: `<unsub-page/>`,
    components: {
        UnsubPage,
    }, el: "#root"
});


//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}
