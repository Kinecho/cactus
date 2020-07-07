<template>
    <div class="prompt-content-card">
        <markdown-text :source="card.text" v-if="card.text"/>
        <div class="photo-container" v-if="card.photo">
            <flamelink-image :image="card.photo"/>
        </div>
        <slot name="actions"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
    import { Prop } from "vue-property-decorator";
    import FlamelinkImage from "@components/FlamelinkImage.vue";
    import MarkdownText from "@components/MarkdownText.vue";

    @Component({
        components: {
            FlamelinkImage,
            MarkdownText,
        }
    })
    export default class PhotoCard extends Vue {
        name = "PhotoCard.vue";

        @Prop({ type: Number, required: true, default: 0 })
        index!: number;

        @Prop({ type: Object as () => PromptContentCardViewModel, required: true, })
        card!: PromptContentCardViewModel;

    }
</script>

<style scoped lang="scss">
    @import "prompts";

    .photo-container {
        margin: 4rem 1.6rem;

        @include r(600) {
            margin: 0 0 4rem;
        }

        img {
            border-radius: .4rem;
            display: block;
            margin: 0 auto; /* center smaller image in card */
            max-width: 56rem;
            width: 100%;
        }
    }
</style>