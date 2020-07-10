<template>
    <div class="prompt-content-card">
        <div class="audio-card">
            <div class="textBox">
                <markdown-text :source="card.text" v-if="card.text"/>
                <div class="actions">
                    <slot name="actions"/>
                </div>
            </div>
            <div class="audio-container" v-if="card.audio">
                <audio controls :src="card.audio.url"/>
            </div>
        </div>
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
    @import "prompts";

    .audio-card {
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

    .audio-container {
        width: 100% ;

        @include r(960) {
            align-self: center;
            margin: 0 auto;
            max-width: 50%;
        }

        audio {
            width: 100%;
        }
    }

</style>