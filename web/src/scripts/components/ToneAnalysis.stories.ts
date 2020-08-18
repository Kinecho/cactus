import Vue from "vue";
import ToneAnalysis from "@components/ToneAnalysis.vue";
import { boolean, number, text } from "@storybook/addon-knobs";
import { ToneID, ToneResult, ToneScore } from "@shared/api/ToneAnalyzerTypes";
import ToneAnalysisOnboardingPlaceholder from "@components/ToneAnalysisOnboardingPlaceholder.vue";
import { ONBOARDING_TONE_RESULTS, PattonSpeech, PattonToneResult } from "@shared/util/ToneAnalyzerFixtures";
import { getRandomNumberBetween } from "@shared/util/StringUtil";
import Logger from "@shared/Logger"

const logger = new Logger("ToneAnalysis.stories");


export default {
    title: "Insights/Tone Analysis"
}

export const OnboardingExample = () => Vue.extend({
    template: `
        <div>
            <h2>This is using the placeholder component.</h2>
            <tone-analysis :sentences-on-new-line="sentencesOnNewLine"/>
        </div>
    `,
    components: { ToneAnalysis: ToneAnalysisOnboardingPlaceholder },
    props: {
        sentencesOnNewLine: {
            default: boolean("Sentences On New Line", false),
        }
    }, computed: {
        toneResult(): ToneResult | null {
            return ONBOARDING_TONE_RESULTS;
        }
    }
});

export const WithToneResults = () => Vue.extend({
    template: `
        <tone-analysis :original-text="originalText" :tone-result="toneResult" :sentences-on-new-line="sentencesOnNewLine"/>
    `,
    components: { ToneAnalysis },
    props: {
        originalText: {
            default: text("Reflection Text", PattonSpeech),
        },
        sentencesOnNewLine: {
            default: boolean("Sentences On New Line", false),
        }
    }, computed: {
        toneResult(): ToneResult | null {
            return PattonToneResult;
        }
    }
});


export const FallbackOption = () => Vue.extend({
    template: `
        <tone-analysis :original-text="originalText"
                :tone-result="toneResult"
                :sentences-on-new-line="sentencesOnNewLine"
                :use-no-results-fallback="useFallbackValues"/>
    `,
    components: { ToneAnalysis },
    props: {
        originalText: {
            default: text("Reflection Text", "This text has no results"),
        },
        sentencesOnNewLine: {
            default: boolean("Sentences On New Line", false),
        },
        useFallbackValues: {
            default: boolean("Use Fallback Values", true),
        }
    }, computed: {
        toneResult(): ToneResult | null {
            return null;
        }
    }
});


export const NoSentenceToneResults = () => Vue.extend({
    template: `
    <div>
        <tone-analysis :original-text="originalText" :tone-result="toneResult" :use-no-results-fallback="false" :sentences-on-new-line="sentencesOnNewLine"/>
        <div>
            <pre>{{JSON.stringify({originalText}, null, 2)}}</pre>
            <pre>{{JSON.stringify(toneResult, null, 2)}}</pre>
        </div>
    </div>
    `,
    components: { ToneAnalysis },
    props: {
        originalText: {
            default: text("Reflection Text", "I like long walks on the beach"),
        },
        sentencesOnNewLine: {
            default: boolean("Sentences On New Line", false),
        },
        numTones: {
            default: number("Num Tones", 1),
        }
    }, computed: {
        toneResult(): ToneResult | null {
            const toneIdList = Object.values(ToneID);
            const tones: ToneScore[] = []
            for (let i = 0; i < this.numTones ?? 0; i++) {
                const tone: ToneID = toneIdList[i];
                tones.push({
                    score: getRandomNumberBetween(0, 1, 2),
                    toneId: tone,
                    toneName: tone.charAt(0).toUpperCase() + tone.slice(1),
                })
            }

            logger.info("document tones", tones);
            return {
                documentTone: {
                    tones: tones,
                }, sentencesTones: []
            };
        }
    }
});