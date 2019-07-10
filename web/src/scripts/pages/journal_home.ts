import "@styles/pages/journal_home.scss"
import Vue from "vue";
import JournalHome from "@components/JournalHome.vue";

new Vue({
    el: "#journal-home-app",
    template: `<JournalHome/>`,
    components: {JournalHome: JournalHome}
});
