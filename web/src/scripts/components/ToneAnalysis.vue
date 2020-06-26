<template>
    <div class="toneAnalysis" v-if="toneResult">
        <nav class="tabs">
            <a v-for="(tone, i) in tones"
                    :key="`tone_${i}`" class="tone"
                    :class="{selected: currentToneId === tone.toneId}"
                    @click="currentToneIndex = i">
                {{tone.toneName}}
            </a>
        </nav>
        <div class="noteText">
            <p v-for="(sentence, i) in toneResult.sentencesTones"
                    :key="`sentence_${i}`"
                    :class="{highlight: sentence.tones && sentence.tones.some(t => t.toneId === currentToneId)}"
            >
                <span class="debug">({{sentence.tones.map(t => t.toneName).join(', ')}})</span>
                <br/>
                {{sentence.text}}

            </p>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { ToneID, ToneResult, ToneScore } from "@shared/api/ToneAnalyzerTypes";
    import { Prop } from "vue-property-decorator";

    @Component
    export default class ToneAnalysis extends Vue {
        name = "ToneAnalysis";

        @Prop({ type: Object as () => ToneResult, required: false, default: null })
        toneResult!: ToneResult | null;


        get tones(): ToneScore[] {
            return this.toneResult?.documentTone?.tones ?? [];
        }

        currentToneIndex = 0;

        get currentToneId(): ToneID | null {
            if (!this.tones || this.tones.length === 0) {
                return null;
            }
            return this.tones[Math.min(this.currentToneIndex, this.tones.length - 1)]?.toneId ?? null;
        };

    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .toneAnalysis {
        @include shadowbox;
        margin: 0 -3.2rem;
        position: relative;

        @include r(374) {
            margin: 0 -2rem;
        }
        @include r(600) {
            margin: 0 -2.4rem;
        }

        &:after {
            background-image: linear-gradient(to right, rgba(255, 255, 255, 0), $white);
            content: "";
            height: 4rem;
            position: absolute;
            right: 0;
            top: 1.2rem;
            width: 4rem;
            z-index: 1;
        }
    }

    .tabs {
        background-color: $white;
        border-radius: 1.2rem 1.2rem 0 0;
        cursor: pointer;
        display: flex;
        font-weight: bold;
        overflow-x: auto;
        overflow-y: hidden;
        position: sticky;
        top: 0;
    }

    .tone {
        padding: 2rem 1.6rem;

        &:first-child {
            padding-left: 3.2rem;
            @include r(374) {
                padding-left: 2.4rem;
            }
        }

        &:hover {
            cursor: pointer;
        }

        &.selected {
            color: $darkestGreen;
        }
    }

    .noteText {
        padding: 0 3.2rem 1.6rem;

        @include r(374) {
            padding: 0 2.4rem 3.2rem;
        }
        @include r(600) {
            padding: 0 2.4rem 3.2rem;
        }

        p {
            margin-bottom: 1.6rem;
        }
    }

    .highlight {
        background-color: lighten($royal, 20%);
        margin: 0 -.4rem 1.6rem;
        padding: .4rem;
    }

    .debug {
        color: red;
        font-family: monospace;
    }

</style>