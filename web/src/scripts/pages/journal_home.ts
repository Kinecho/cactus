import "@styles/pages/journal_home.scss"
import Vue from "vue";
import JournalHome from "@components/JournalHome.vue";
import {commonInit} from "@web/common";

commonInit();

new Vue({
    el: "#journal-home-app",
    template: `<JournalHome/>`,
    components: {JournalHome: JournalHome}
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}