<template>
    <div class="prompt-content-card">
        <div class="quote-card">
            <span>quote card</span>
            <div class="quote">
                <markdown-text :source="card.quote.text" v-if="card.quote.text" treatment="quote"/>
            </div>
            <div class="author">
                <strong><markdown-text :source="card.quote.authorName" v-if="card.quote.authorName"/></strong>
                <p class="byline"><markdown-text :source="card.quote.authorTitle" v-if="card.quote.authorTitle"/></p>
            </div>
        </div>
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

    .quote-card {
        padding: 0 .8rem;

        @include r(374) {
            margin: 0 auto;
            max-width: 48rem;
            padding: 0 2.4rem;
        }
        @include r(768) {
            max-width: none;
            padding: 0 6.4rem;
        }
    }

    .quote {
        margin-bottom: 2.4rem;
    }

    .author {
        font-size: 1.6rem;

        @include r(768) {
            font-size: 1.8rem;
        }
    }

    .byline {
        opacity: .8;
    }

</style>