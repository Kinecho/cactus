<template>
    <div class="prompt-content-card elements-card">
        <div class="textBox" v-if="card.text">
            <markdown-text :source="card.text"/>
        </div>
        <elements/>
        <slot name="actions"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import MarkdownText from "@components/MarkdownText.vue";
    import { Prop } from "vue-property-decorator";
    import Elements from "@components/ElementsOverview.vue";
    import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";

    @Component({
        components: {
            MarkdownText,
            Elements,
        }
    })
    export default class ElementsCard extends Vue {
        name = "ElementsCard";

        @Prop({ type: Object as () => PromptContentCardViewModel, required: true })
        card!: PromptContentCardViewModel;
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";
    @import "prompts";

    .elements-card {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 80vh;
        padding: 0 3.2rem;

        @include r(374) {
            padding: 0 5.6rem;
        }
        @include r(768) {
            align-items: center;
            flex-direction: row;
            justify-content: flex-start;
            padding: 0 9.6rem;
        }
    }

    .textBox {
        @include r(768) {
            padding-right: 6.4rem;
            width: 50%;
        }
    }

    .elements-container {
        margin: 0 -2.4rem;
        width: calc(100% + 4.8rem);

        @include r(768) {
            align-self: center;
            margin: 0 auto;
            max-width: 50%;
            width: 100%;
        }
    }

</style>
