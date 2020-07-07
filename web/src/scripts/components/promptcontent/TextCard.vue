<template>
    <div class="prompt-content-card">
        <div class="text-card">
            <div class="textBox">
                <slot name="element"/>
                <h4 class="label" v-if="card.content.label">{{card.content.label}}</h4>
                <h2 class="title" v-if="card.content.title">{{card.content.title}}</h2>
                <markdown-text :source="text" v-if="text"/>
                <slot name="actions"/>
            </div>
            <div class="backgroundImage" v-if="card.backgroundImage" :class="[card.backgroundImage.position]">
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

    // Not sure that this selector is used. Feel free to change.
    .image {
        height: auto;
        width: 100%;

        @include r(768) {
            align-self: center;
            max-width: 33%;
        }
    }

    // Copied from LegacyPromptContentCard.vue
    .backgroundImage {
        &:empty {
            display: none;
        }

        @include r(600) {
            display: flex;
            justify-content: center;
            max-height: none;
            order: 1;
            position: static;
        }

        &.top {
            margin-top: -2.4rem;
        }

        &.bottom {
            align-items: flex-end;
            margin: 0 -2.4rem -4rem;
        }

        img {
            height: auto;
            max-height: 35rem;
            max-width: 100%;
        }
    }

</style>