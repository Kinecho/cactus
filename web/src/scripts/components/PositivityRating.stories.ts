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
        rating: {
            default: number("Score (-1 to 1)", 0, { min: -1, max: 1 })
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
                score: this.rating,
            }
        }
    }
})