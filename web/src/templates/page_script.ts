// tslint:disable-next-line:no-implicit-dependencies
import Vue from "vue";

// import Page from "@components/YOUR_PAGE"
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

const logger = new Logger("YOUR_PAGE");
commonInit();

new Vue({
    el: "#app",
    template: `<!--<YOUR_PAGE/>-->`,
    components: {
        // YOUR_PAGE,
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}