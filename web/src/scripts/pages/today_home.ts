import "@styles/pages/journal_home.scss"
import Vue from "vue";
import TodayHome from "@components/TodayHome.vue";
import {commonInit} from "@web/common";

commonInit();

new Vue({
    el: "#today-home-app",
    template: `<TodayHome/>`,
    components: {TodayHome: TodayHome}
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}