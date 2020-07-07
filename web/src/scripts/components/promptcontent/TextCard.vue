<template>
    <div class="prompt-content-card">
        <div class="text-card">
            <div class="textBox">
                <slot name="element"/>
                <h2 class="title" v-if="card.content.title">{{card.content.title}}</h2>
                <markdown-text :source="text" v-if="text"/>
                <div class="actions">
                    <slot name="actions"/>
                </div>
            </div>
            <div class="backgroundImage" v-if="card.backgroundImage">
                <flamelink-image :image="card.backgroundImage"/>
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
    @import "prompts";
    @import "mixins";

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
            max-width: 64rem;
            min-height: 0;
        }
        @include r(960) {
            align-items: center;
            flex-direction: row;
            justify-content: flex-start;
            max-width: none;
            padding: 0 6.4rem;
        }
    }

    .textBox {
        margin-bottom: 5.6rem;

        @include r(960) {
            flex-grow: 1;
            margin-bottom: 0;
            padding-right: 6.4rem;
            width: 66%;
        }
    }

    .backgroundImage {
        height: auto;
        width: 100%;

        @include r(600) {
            display: flex;
            justify-content: center;
            max-height: none;
            order: 1;
            position: static;
        }
        @include r(768) {
            justify-content: flex-start;
        }
        @include r(960) {
            justify-content: center;
            max-width: 33%;
        }

        &:empty {
            display: none;
        }

        img {
            align-self: center;
            height: auto;
            max-height: 35rem;
            max-width: 100%;
        }
    }

</style>