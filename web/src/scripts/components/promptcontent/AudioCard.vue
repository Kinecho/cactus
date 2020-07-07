<template>
    <div class="prompt-content-card">
        <markdown-text :source="card.text" v-if="card.text"/>
        <div class="audio-container" v-if="card.audio">
            <audio controls :src="card.audio.url"/>
        </div>
        <slot name="actions"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";
    import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
    import MarkdownText from "@components/MarkdownText.vue";

    @Component({
        components: {
            MarkdownText
        }
    })
    export default class AudioCard extends Vue {
        name = "AudioCard";

        @Prop({ type: Number, required: true, default: 0 })
        index!: number;

        @Prop({ type: Object as () => PromptContentCardViewModel, required: true, })
        card!: PromptContentCardViewModel;

    }
</script>

<style scoped lang="scss">

</style>