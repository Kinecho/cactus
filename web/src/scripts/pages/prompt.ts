// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/prompt.scss"
import Vue from "vue";
import PromptPage from "@components/PromptContent.vue";
import NavBar from "@components/NavBar.vue";
import Footer from "@components/StardardFooter.vue";

new Vue({
    el: "#app",
    template: `<div>
    <Prompt/>
</div>`,
    components: {
        Prompt: PromptPage,
        NavBar,
        Footer,
    }
})