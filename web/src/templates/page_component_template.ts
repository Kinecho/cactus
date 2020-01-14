// @ts-ignore
import $COMPONENT$ from "@components/$COMPONENT$.vue"
import Vue from "vue";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

const logger = new Logger("$COMPONENT$");
commonInit();

new Vue({
    el: "#app",
    template: `<$COMPONENT$/>`,
    components: {
        $COMPONENT$,
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}