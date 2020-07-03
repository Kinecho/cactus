<template>
    <div class="prompt-content-card">
        <span>quote card</span>
        <markdown-text :source="card.quote.text" v-if="card.quote.text" treatment="quote"/>
        <markdown-text :source="card.quote.authorName" v-if="card.quote.authorName"/>
        <markdown-text :source="card.quote.authorTitle" v-if="card.quote.authorTitle"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
    import MarkdownText from "@components/MarkdownText.vue";
    import { Prop } from "vue-property-decorator";

    @Component({
        components: {
            MarkdownText
        }
    })
    export default class QuoteCard extends Vue {
        name = "QuoteCard.vue";

        @Prop({ type: Number, required: true, default: 0 })
        index!: number;

        @Prop({ type: Object as () => PromptContentCardViewModel, required: true, })
        card!: PromptContentCardViewModel;


    }
</script>

<style scoped lang="scss">
    @import "mixins";

    .prompt-content-card {
        padding: 4rem 2.4rem;

        @include r(374) {
            //do not add margin: auto here as it makes the cards jumpy
            padding: 5.6rem 3.2rem;
            width: 100%;
        }
    }
</style>