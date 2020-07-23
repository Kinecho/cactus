<template>
    <div>
        <div class="toneAnalysis">
            <nav class="tabs" v-if="!hasTones">
                <span class="tone none">No emotions detected</span>
            </nav>
            <nav class="tabs" v-else-if="hasSentenceBreakdown">
            <span v-for="(tone, i) in tones"
                    :key="`tone_${i}`"
                    class="tone"
                    :data-disable-card-nav="true"
                    :class="{selected: currentToneId === tone.toneId}"
                    @click="currentToneIndex = i">
                {{tone.toneName}}
            </span>
            </nav>
            <nav class="tabs" v-else-if="!hasSentenceBreakdown">
                <span class="tone none">Overall tone is <span class="">{{toneListText}}</span></span>
            </nav>
            <div class="noteText">
                <p class="analyzed-text" v-if="useDefaultValues && originalText">Your note didn't have enough text to
                    reveal emotions.</p>
                <p class="analyzed-text" v-if="!originalText && useNoResultsFallback"><a href="#" @click="previous">Add
                    a note</a> to your reflection to reveal specific emotions.</p>
                <p v-for="(paragraph, i) in paragraphs" :key="`paragraph_${i}`" class="analyzed-text" :class="{fallback: useDefaultValues}">
                <span v-for="(sentence, i) in paragraph"
                        :key="`sentence_${i}`"
                        :class="{highlight: sentence.tones && sentence.tones.some(t => t.toneId === currentToneId) && showHighlights}"
                >{{sentence.text + ' '}}</span>
                </p>
            </div>
        </div>
        <button v-if="!useDefaultValues" class="infoButton tertiary icon" @click="showModal">
            <svg-icon icon="info" class="infoIcon"/>
            <span>About</span>
        </button>
        <tone-analyzer-modal
                :showModal="modalVisible"
                @close="hideModal()"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { SentenceTone, ToneID, ToneResult, ToneScore } from "@shared/api/ToneAnalyzerTypes";
    import { Prop, Watch } from "vue-property-decorator";
    import { isBlank } from "@shared/util/StringUtil";
    import Logger from "@shared/Logger"
    import { createParagraphs } from "@shared/util/ToneAnalyzerUtil";
    import { ONBOARDING_DEFAULT_TEXT, ONBOARDING_TONE_RESULTS } from "@shared/util/ToneAnalyzerFixtures";
    import ToneAnalyzerModal from "@components/ToneAnalyzerModal.vue"
    import SvgIcon from "@components/SvgIcon.vue";

    const logger = new Logger("ToneAnalysis");

    interface ToneScoreMap {
        [key: string]: ToneScore
    }

    @Component({
        components: {
            ToneAnalyzerModal,
            SvgIcon,
        }
    })
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

        modalVisible: boolean = false;
        paragraphs: SentenceTone[][] = [];
        tones: ToneScore[] = [];

        @Watch("originalText")
        onOriginalText() {
            this.setupData()
        }

        @Watch("toneResult")
        onToneResult() {
            this.setupData()
        }

        setupData() {
            this.tones = this.getTones();
            this.paragraphs = this.useDefaultValues ? this.getFallbackParagraphs() : this.getOriginalParagraphs();
        }

        beforeMount() {
            this.setupData();
        }

        get useDefaultValues(): boolean {
            return this.useNoResultsFallback && Object.keys(this.toneResult?.sentencesTones ?? []).length === 0;
        }

        get showHighlights(): boolean {
            return this.useDefaultValues || (this.toneResult?.sentencesTones ?? []).length > 0;
        }

        getFallbackToneMap(): ToneScoreMap {
            const toneMap: ToneScoreMap = {}

            ONBOARDING_TONE_RESULTS.sentencesTones?.forEach(s => {
                s.tones?.forEach(t => {
                    toneMap[t.toneId] = t;
                })
            })

            ONBOARDING_TONE_RESULTS.documentTone?.tones?.forEach(t => {
                toneMap[t.toneId] = t;
            })
            return toneMap;
        }

        getOriginalToneMap(): ToneScoreMap {
            const toneMap: ToneScoreMap = {}
            this.toneResult?.sentencesTones?.forEach(s => {
                s.tones?.forEach(t => {
                    toneMap[t.toneId] = t;
                })
            })

            this.toneResult?.documentTone?.tones?.forEach(t => {
                toneMap[t.toneId] = t;
            })
            return toneMap;
        }

        getTones(): ToneScore[] {
            if (this.useDefaultValues) {
                return Object.values(this.getFallbackToneMap());
            } else {
                return Object.values(this.getOriginalToneMap());
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
                return [tones.map(t => this.formatToneScore(t)).join(", "), this.formatToneScore(last)].join(" & ");
            }
            return null;
        }

        get sentenceTones(): SentenceTone[] {
            return this.useDefaultValues ? ONBOARDING_TONE_RESULTS.sentencesTones! : this.toneResult?.sentencesTones ?? [];
        }

        get hasSentenceBreakdown(): boolean {
            return this.sentenceTones.length > 0;
        }

        currentToneIndex = 0;

        get currentToneId(): ToneID | null {
            if (!this.tones || this.tones.length === 0) {
                return null;
            }
            return this.tones[Math.min(this.currentToneIndex, this.tones.length - 1)]?.toneId ?? null;
        };

        getOriginalParagraphs(): SentenceTone[][] {
            const analysisSentences = this.toneResult?.sentencesTones ?? [];
            const displayText = this.originalText;
            const documentTones = this.toneResult?.documentTone?.tones ?? []

            // logger.info("Original text", this.originalText);
            // logger.info("display text", displayText);

            const p = createParagraphs({
                text: displayText,
                sentenceTones: analysisSentences,
                documentTones: documentTones
            })

            if (!displayText || isBlank(displayText) || this.sentencesOnNewLine) {
                return p.flat().map(i => [i]);
            }

            logger.info("create paragraph result", p);
            return p;
        }

        getFallbackParagraphs() {
            const analysisSentences = ONBOARDING_TONE_RESULTS.sentencesTones;
            const displayText = `${ ONBOARDING_DEFAULT_TEXT }`.trim();
            const documentTones = ONBOARDING_TONE_RESULTS.documentTone?.tones;

            const p = createParagraphs({
                text: displayText,
                sentenceTones: analysisSentences,
                documentTones: documentTones
            })

            if (!displayText || isBlank(displayText) || this.sentencesOnNewLine) {
                return p.flat().map(i => [i]);
            }

            logger.info("create paragraph result", p);
            return p;
        }


        showModal() {
            this.modalVisible = true;
        }

        hideModal() {
            this.modalVisible = false;
        }

        previous() {
            this.$emit("previous");
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .toneAnalysis {
        @include shadowbox;
        margin-bottom: 3.2rem;
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
        padding: 2rem 1.2rem;
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
        padding-bottom: 1.6rem;

        @include r(600) {
            max-height: 36rem;
            overflow-x: hidden;
            overflow-y: auto;
        }

        span {
            margin-right: .4rem;
        }
    }

    .analyzed-text,
    .fallback,
    .original-text {
        margin-bottom: 1.6rem;
        padding: 0 3.2rem;

        @include r(374) {
            padding: 0 2.4rem;
        }
    }

    .noEmotions {
        font-size: 1.6rem;
        margin: 0 0 2.4rem;
        opacity: .8;
    }

    .highlight {
        background-color: lighten($royal, 25%);
        border-radius: .4rem;
    }

    .debug {
        color: red;
        font-family: monospace;
    }

    button.infoButton {
        position: absolute;
        right: 5.6rem;
        top: 2rem - 1.2rem;

        @include r(600) {
            margin-left: -1.2rem;
            position: static;

            &:hover {
                background-color: transparent;
            }
        }

        span {
            display: none;

            @include r(600) {
                display: block;
                padding-left: .4rem;
            }
        }
    }

</style>
