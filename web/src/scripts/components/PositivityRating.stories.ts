import Vue from "vue";
import PositivityRating from "@components/PositivityRating.vue";
import { number } from "@storybook/addon-knobs";
import { SentimentScore } from "@shared/api/InsightLanguageTypes";

export default {
    title: "Insights/Positivity Rating"
}

export const Default = () => Vue.extend({
    template: `
        <div :style="wrapperStyles">
            <positivity-rating :sentiment-score="sentimentScore"/>
        </div>`,
    components: {
        PositivityRating,
    },
    props: {
        percent: {
            default: number("Score (0 to 100)", 0, { min: 0, max: 100 })
        },
        magnitude: {
            default: number("Magnitude (non-negative)", 1),
        }
    },
    computed: {
        wrapperStyles(): any {
            return {
                padding: '5rem',
            }
        },
        sentimentScore(): SentimentScore {
            return {
                magnitude: this.magnitude,
                score: 2* this.percent / 100 - 1,
            }
        }
    }
})