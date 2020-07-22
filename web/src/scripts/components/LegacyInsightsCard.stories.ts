import Vue from "vue";
import LegacyInsightsCard from "@components/LegacyInsightsCard.vue";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import { Content, ContentType } from "@shared/models/PromptContent";
import { boolean } from "@storybook/addon-knobs";
import { PattonSentiment, PattonToneResult } from "@shared/util/ToneAnalyzerFixtures";

export default {
    title: "Legacy Prompt Content/Legacy Insights Card"
}

const insightsContent: Content = {
    contentType: ContentType.reflection_analysis,
}

export const Loading = () => Vue.extend({
    template: `
        <insights-card :reflection-response="reflectionResponse"/>`,
    components: {
        InsightsCard: LegacyInsightsCard,
    },
    computed: {
        reflectionResponse(): ReflectionResponse | null {
            return null
        }
    }
})


export const ConditionalLoading = () => Vue.extend({
    template: `
        <insights-card :reflection-response="reflectionResponse"/>`,
    components: {
        InsightsCard: LegacyInsightsCard,
    },
    props: {
        hasTone: { default: boolean("Has Tone", false) },
        hasSentiment: { default: boolean("Has Sentiment", false) }
    },
    computed: {
        reflectionResponse(): ReflectionResponse | null {
            if (!this.hasTone && !this.hasSentiment) {
                return null;
            }
            const r = new ReflectionResponse();
            r.promptId = "fakeid";

            if (this.hasTone) {
                r.toneAnalysis = PattonToneResult
            } else {
                r.toneAnalysis = undefined;
            }

            if (this.hasSentiment) {
                r.sentiment = PattonSentiment;
            }

            return r;
        }
    }
})
