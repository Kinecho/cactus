import Vue from "vue";
import ToneAnalysis from "@components/ToneAnalysis.vue";
import { boolean, text } from "@storybook/addon-knobs";
import { ToneID, ToneResult } from "@shared/api/ToneAnalyzerTypes";
import { PattonSpeech, PattonToneResult } from "@shared/util/ToneAnalyzerFixtures";

export default {
    title: "Insights/Tone Analysis"
}

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


export const NoSentenceToneResults = () => Vue.extend({
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
            return { documentTone: { tones: [] }, sentencesTones: [] };
        }
    }
});
