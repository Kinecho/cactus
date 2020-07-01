import Vue from "vue";
import WordBubbleEmbedPage from "@web/views/WordBubbleEmbedPage.vue";

new Vue({
    template: `
        <WordBubbleEmbedPage/>
    `,
    components: {
        WordBubbleEmbedPage,
    }
}).$mount("#app");