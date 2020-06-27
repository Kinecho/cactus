import Vue from "vue";
import InsightsCard from "@components/InsightsCard.vue";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import { Content, ContentType } from "@shared/models/PromptContent";
import { boolean } from "@storybook/addon-knobs";
import { ToneResult } from "@shared/api/ToneAnalyzerTypes";
import { PattonSentiment, PattonToneResult } from "@shared/util/ToneAnalyzerFixtures";

export default {
    title: "Prompt Content/Insights Card"
}

const insightsContent: Content = {
    contentType: ContentType.insights,
}

export const Loading = () => Vue.extend({
    template: `
        <insights-card :reflection-response="reflectionResponse"/>`,
    components: {
        InsightsCard,
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
        InsightsCard,
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
