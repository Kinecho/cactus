import "@styles/pages/journal_home.scss"
import Vue from "vue";
import JournalHome from "@components/JournalHome.vue";
import {configureDirectives} from "@web/vueDirectives";

configureDirectives();


new Vue({
    el: "#journal-home-app",
    template: `<JournalHome/>`,
    components: {JournalHome: JournalHome}
});
