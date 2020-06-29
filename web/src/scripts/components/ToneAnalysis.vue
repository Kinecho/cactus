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
                    :class="{selected: currentToneId === tone.toneId}"
                    @click="currentToneIndex = i">
                {{tone.toneName}}
            </span>
        </nav>
        <nav class="tabs" v-else-if="!hasSentenceBreakdown">
            <span class="tone none">Overall tone is <span class="">{{toneListText}}</span></span>
        </nav>
        <div class="noteText">
            <p v-if="useDefaultValues && originalText" class="original-text">{{originalText}}</p>
            <p v-for="(paragraph, i) in paragraphs" :key="`paragraph_${i}`" class="analyzed-text" :class="{fallback: useDefaultValues}">
                <span v-for="(sentence, i) in paragraph"
                        :key="`sentence_${i}`"
                        :class="{highlight: sentence.tones && sentence.tones.some(t => t.toneId === currentToneId) && showHighlights}"
                >{{sentence.text + ' '}}</span>
            </p>
        </div>
    </div>
    <button class="infoButton tertiary icon" @click="showModal">
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
    import { Prop } from "vue-property-decorator";
    import { isBlank } from "@shared/util/StringUtil";
    import Logger from "@shared/Logger"
    import { createParagraphs } from "@shared/util/ToneAnalyzerUtil";
    import { ONBOARDING_DEFAULT_TEXT, ONBOARDING_TONE_RESULTS } from "@shared/util/ToneAnalyzerFixtures";
    import ToneAnalyzerModal from "@components/ToneAnalyzerModal.vue"
    import SvgIcon from "@components/SvgIcon.vue";

    const logger = new Logger("ToneAnalysis");

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

        get useDefaultValues(): boolean {
            return this.useNoResultsFallback && Object.keys(this.originalToneMap).length === 0;
        }

        get showHighlights(): boolean {
            return this.useDefaultValues || (this.toneResult?.sentencesTones ?? []).length > 0;
        }

        get fallbackToneMap(): { [id: ToneID]: ToneScore } {
            const toneMap: { [key: ToneID]: ToneScore } = {}

            ONBOARDING_TONE_RESULTS.sentencesTones.forEach(s => {
                s.tones?.forEach(t => {
                    toneMap[t.toneId] = t;
                })
            })

            ONBOARDING_TONE_RESULTS.documentTone?.tones?.forEach(t => {
                toneMap[t.toneId] = t;
            })
            return Object.values(toneMap);
        }

        get originalToneMap(): { [id: ToneID]: ToneScore } {
            const toneMap: { [key: ToneID]: ToneScore } = {}
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

        get tones(): ToneScore[] {
            if (this.useDefaultValues) {
                return Object.values(this.fallbackToneMap);
            } else {
                return Object.values(this.originalToneMap);
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

        get paragraphs(): SentenceTone[][] {
            const analysisSentences = this.useDefaultValues ? ONBOARDING_TONE_RESULTS.sentencesTones : this.toneResult?.sentencesTones ?? [];
            const displayText = this.useDefaultValues ? `${ ONBOARDING_DEFAULT_TEXT }`.trim() : this.originalText;
            const documentTones = this.useDefaultValues ? ONBOARDING_TONE_RESULTS.documentTone?.tones : this.toneResult?.documentTone?.tones ?? []

            logger.info("Original text", this.originalText);
            logger.info("display text", displayText);
            if (!displayText || isBlank(displayText) || this.sentencesOnNewLine) {
                const r = analysisSentences?.map(sentence => ([sentence])) ?? []
                logger.info("Using original sentence map", r);
                return r;
            }

            const p = createParagraphs({
                text: displayText,
                sentenceTones: analysisSentences,
                documentTones: documentTones
            })
            logger.info("create paragraph result", p);
            return p;
        }

        showModal() {
            this.modalVisible = true;
        }

        hideModal() {
            this.modalVisible = false;
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
        padding-bottom: 1.6rem;

        @include r(600) {
            max-height: 47rem;
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

    .original-text + .fallback {
        border-top: 1px solid lighten($lightDolphin, 25%);
        margin-top: 2.4rem;
        padding-top: 2.4rem;
    }

    .fallback {
        font-size: 1.6rem;
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
