import { InsightWord } from "@shared/models/ReflectionResponse";
import WordChart from "@components/InsightWordChart.vue";

export default {
    title: "Charts/Word Bubbles",
}

export const SimpleWordChart = () => ({
    components: { WordChart },
    template: '<word-chart :words="words"/>',
    data(): { words: InsightWord[] } {
        return {
            words: [{ word: "Hello" }, { word: "Test" }]
        }
    }
})


export const WordChartWithWords = () => ({
    components: { WordChart },
    template: '<div><h1>Hello!</h1><WordChart :word="words" :blurry="false"/></div>',
    data(): {
        words: InsightWord[],
    } {
        return {
            words: [{ word: "Hello", frequency: .1 }, { word: "StoryBook", frequency: 0.2 }],
        }
    }
})
