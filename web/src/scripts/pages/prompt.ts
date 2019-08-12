// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/prompt.scss"
import Vue from "vue";
import PromptPage from "@components/PromptContent.vue";

new Vue({
    el: "#app",
    template: `<Prompt/>`,
    components: {
        Prompt: PromptPage,
    }
})