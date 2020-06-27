<template>
    <div class="toneAnalysis" v-if="toneResult">
        <nav class="tabs" v-if="tones && tones.length > 0">
            <span v-for="(tone, i) in tones"
                    :key="`tone_${i}`"
                    class="tone"
                    :class="{selected: currentToneId === tone.toneId}"
                    @click="currentToneIndex = i">
                {{tone.toneName}}
            </span>
        </nav>
        <nav class="tabs" v-else>
            <span class="tone none">No Emotions Detected</span>
        </nav>

        <div class="noteText">
            <p v-for="(paragraph, i) in paragraphs" :key="`paragraph_${i}`">
                <span v-for="(sentence, i) in paragraph"
                        :key="`sentence_${i}`"
                        :class="{highlight: sentence.tones && sentence.tones.some(t => t.toneId === currentToneId)}"
                >{{sentence.text + ' '}}</span>
            </p>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { SentenceTone, ToneID, ToneResult, ToneScore } from "@shared/api/ToneAnalyzerTypes";
    import { Prop } from "vue-property-decorator";
    import { isBlank } from "@shared/util/StringUtil";
    import Logger from "@shared/Logger"
    import { createParagraphs } from "@shared/util/ToneAnalyzerUtil";

    const logger = new Logger("ToneAnalysis");

    @Component
    export default class ToneAnalysis extends Vue {
        name = "ToneAnalysis";

        @Prop({ type: String, default: null, required: false })
        originalText!: string | null

        @Prop({ type: Object as () => ToneResult, required: false, default: null })
        toneResult!: ToneResult | null;

        @Prop({ type: Boolean, default: false })
        sentencesOnNewLine!: boolean;

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

        get paragraphs(): SentenceTone[][] {
            const analysisSentences = this.toneResult?.sentencesTones ?? []
            logger.info("Original text", this.originalText);
            if (!this.originalText || isBlank(this.originalText) || this.sentencesOnNewLine) {
                const r = analysisSentences?.map(sentence => ([sentence])) ?? []
                logger.info("Using original sentence map", r);
                return r;
            }

            const p = createParagraphs({ text: this.originalText, sentenceTones: analysisSentences })
            logger.info("create paragraph result", p);
            return p;
        }

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
            margin: 0;
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
        color: $darkGreen;

        &:first-child {
            padding-left: 3.2rem;

            @include r(374) {
                padding-left: 2.4rem;
            }
        }

        &:hover {
            cursor: pointer;
        }

        &.selected, &.none {
            color: $darkestGreen;
        }

        &.none {
            cursor: default;
        }
    }

    .noteText {
        line-height: 1.6;
        padding: 0 3.2rem 1.6rem;

        @include r(374) {
            padding: 0 2.4rem 3.2rem;
        }
        @include r(600) {
            max-height: 47rem;
            overflow-x: hidden;
            overflow-y: auto;
            padding: 0 2.4rem 3.2rem;
        }

        p {
            margin-bottom: 1.6rem;
        }
    }

    .highlight {
        background-color: lighten($royal, 25%);
        border-radius: .4rem;
        //margin-right: .4rem; //disabling because the paragraphs jump around when switching Emotion selections
    }

    .debug {
        color: red;
        font-family: monospace;
    }

</style>
