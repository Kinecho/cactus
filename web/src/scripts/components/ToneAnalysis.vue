<template>
    <div class="toneAnalysis">
        <nav class="tabs" v-if="!hasTones">
            <span class="tone none">No emotions detected</span>
        </nav>
        <nav class="tabs" v-else-if="hasSentenceBreakdown">
            <span v-for="(tone, i) in tones"
                    :key="`tone_${i}`"
                    class="tone"
                    :class="{selected: currentToneId === tone.toneId}"
                    @click="currentToneIndex = i">
                {{tone.toneName}}
            </span>
        </nav>
        <nav class="tabs" v-else-if="!hasSentenceBreakdown">
            <span class="tone none">Overall tone is: <span class="">{{toneListText}}</span></span>
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
    import { formatPercentage, isBlank } from "@shared/util/StringUtil";
    import Logger from "@shared/Logger"
    import { createParagraphs } from "@shared/util/ToneAnalyzerUtil";
    import { ONBOARDING_DEFAULT_TEXT, ONBOARDING_TONE_RESULTS } from "@shared/util/ToneAnalyzerFixtures";

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

        @Prop({ type: Boolean, default: true })
        useNoResultsFallback!: boolean;

        get useDefaultValues(): boolean {
            const tones = this.toneResult?.documentTone?.tones ?? [];
            return this.useNoResultsFallback && tones.length === 0;
        }

        get tones(): ToneScore[] {
            const tones = this.toneResult?.documentTone?.tones;
            if (this.useDefaultValues) {
                return ONBOARDING_TONE_RESULTS.documentTone?.tones ?? [];
            } else {
                return tones;
            }
        }

        get hasTones(): boolean {
            return this.tones && this.tones.length > 0;
        }

        formatToneScore(t?: ToneScore): string | undefined {
            if (!t) {
                return undefined;
            }
            return `${ t.toneName }`
        }

        get toneListText(): string | null {
            if (this.tones && this.tones.length > 0) {
                let tones = [...this.tones];
                if (tones.length === 1) {
                    const txt = this.formatToneScore(tones[0]) ?? null;
                    logger.info("Tone Text", txt);
                    return txt;
                }
                let last = tones.pop();
                return [tones.map(t => this.formatToneScore(t)).join(", "), this.formatToneScore(last)].join(" and ");
            }
            return null;
        }

        get hasSentenceBreakdown(): boolean {
            const tones = this.toneResult?.sentencesTones ?? [];
            return tones.length > 0;
        }

        currentToneIndex = 0;

        get currentToneId(): ToneID | null {
            if (!this.tones || this.tones.length === 0) {
                return null;
            }
            return this.tones[Math.min(this.currentToneIndex, this.tones.length - 1)]?.toneId ?? null;
        };


        get paragraphs(): SentenceTone[][] {
            const analysisSentences = this.useDefaultValues ? ONBOARDING_TONE_RESULTS.sentencesTones : this.toneResult?.sentencesTones ?? [];
            const displayText = this.useDefaultValues ? ONBOARDING_DEFAULT_TEXT : this.originalText;
            logger.info("Original text", this.originalText);
            logger.info("display text", displayText);
            if (!displayText || isBlank(displayText) || this.sentencesOnNewLine) {
                const r = analysisSentences?.map(sentence => ([sentence])) ?? []
                logger.info("Using original sentence map", r);
                return r;
            }

            const p = createParagraphs({ text: displayText, sentenceTones: analysisSentences })
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
        position: relative;

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

        span {
            margin-right: .4rem;
        }
    }

    .highlight {
        background-color: lighten($royal, 25%);
        border-radius: .4rem;
    }

    .debug {
        color: red;
        font-family: monospace;
    }

</style>
