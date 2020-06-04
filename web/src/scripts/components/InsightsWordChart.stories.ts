import { InsightWord } from "@shared/models/ReflectionResponse";
import WordChart from "@components/InsightWordChart.vue";

export default {
    title: "Charts/Word Bubbles",
}

export const SimpleWordChart = () => ({
    components: { WordChart },
    template: `
        <div :style="{maxWidth: '300px'}">
            <word-chart :words="words"/>
        </div>`,
    data(): { words: InsightWord[] } {
        return {
            words: [{ word: "Hello" }, { word: "Test" }]
        }
    }
})
