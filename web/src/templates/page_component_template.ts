// @ts-ignore
import $COMPONENT$ from "@components/$COMPONENT$"
import Vue from "vue";
import {commonInit} from "@web/common";

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
        console.error("Error accepting hot reload", error);
    })
}