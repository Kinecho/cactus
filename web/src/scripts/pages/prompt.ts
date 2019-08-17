// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/prompt.scss"
import Vue from "vue";
import PromptPage from "@components/PromptContent.vue";
import NavBar from "@components/NavBar.vue";
import Footer from "@components/StardardFooter.vue";
import {PageRoute} from "@web/PageRoutes";

const journalHome = PageRoute.JOURNAL_HOME;

new Vue({
    el: "#app",
    template: `<div class="prompt-page">
    <Prompt v-on:close="redirectToJournal"/>
</div>`,
    components: {
        Prompt: PromptPage,
        NavBar,
        Footer,
    }, methods: {
        redirectToJournal(): void {
            window.location.href = PageRoute.JOURNAL_HOME;
        }
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}