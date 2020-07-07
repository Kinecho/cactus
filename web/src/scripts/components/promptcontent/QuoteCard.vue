<template>
    <div class="prompt-content-card">
        <div class="quote-card">
            <div class="quote">
                <markdown-text :source="card.quote.text" v-if="card.quote.text" treatment="quote"/>
            </div>
            <div class="author">
                <div class="avatar-container" v-if="card.quote.avatar">
                    <flamelink-image v-bind:image="card.quote.avatar" :width="60"/>
                </div>
                <strong>
                    <markdown-text :source="card.quote.authorName" v-if="card.quote.authorName"/>
                </strong>
                <p class="byline">
                    <markdown-text :source="card.quote.authorTitle" v-if="card.quote.authorTitle"/>
                </p>
            </div>

            <div class="actions">
                <slot name="actions"/>
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
    import FlamelinkImage from "@components/FlamelinkImage.vue";

    @Component({
        components: {
            MarkdownText,
            FlamelinkImage,
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
    @import "prompts";
    @import "mixins";

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

    .avatar-container {
        margin-bottom: 2.4rem;

        img {
            $avatarSize: 5.6rem;
            height: $avatarSize;
            width: $avatarSize;
        }
    }

    .byline {
        opacity: .8;
    }

    .actions {
        &:empty {
            display: none;
        }

        font-size: 2rem;

        > * {
            margin-bottom: 1rem;
        }
    }

</style>