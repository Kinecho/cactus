<template>
    <div class="prompt-content-card">
        <div class="text-card">
            <div class="textBox">
                <span>text card</span>
                <markdown-text :source="text" v-if="text"/>
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
    export default class TextCard extends Vue {
        name = "TextCard.vue";

        @Prop({ type: Number, required: true, default: 0 })
        index!: number;

        @Prop({ type: Object as () => PromptContentCardViewModel, required: true, })
        card!: PromptContentCardViewModel;

        get text(): string | null | undefined {
            return this.card.text;
        }

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

    .text-card {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 80vh;
        padding: 0 .8rem;

        @include r(374) {
            justify-content: center;
            margin: 0 auto;
            max-width: 48rem;
            padding: 0 2.4rem;
        }
        @include r(768) {
            align-items: center;
            flex-direction: row;
            justify-content: flex-start;
            max-width: none;
            padding: 0 6.4rem;
        }
    }

    .textBox {
        margin-bottom: 5.6rem;

        @include r(768) {
            margin-bottom: 0;
            padding-right: 6.4rem;
            width: 66%;
        }
    }

    .image {
        height: auto;
        width: 100%;

        @include r(768) {
            align-self: center;
            max-width: 33%;
        }
    }
</style>