import Vue from "vue";
import GapAnalysisQuestion from "@shared/models/GapAnalysisQuestion";
import { CactusElement } from "@shared/models/CactusElement";
import Question from "@components/gapanalysis/Question.vue";
import { text } from "@storybook/addon-knobs";

export default {
    title: "Gap Analysis/Question"
}

const genericQuestion = (title: string) => {
    return GapAnalysisQuestion.create({
        title,
        element: CactusElement.emotions,
    }).addOption(1, "Value 1")
    .addOption(2, "Value 2")
    .addOption(3, "Value 3")
    .addOption(4, "Value 3")
    .addOption(5, "Value 5")
}

export const StandardQuestion = () => Vue.extend({
    components: {
        Question,
    },
    template: `
        <div>
            <question :question="question" @change="handleChange" :current-value="selectedValue"/>
            <div :style="{padding: '1rem'}">
                Selected Value <span :style="{color: 'red'}">{{selectedValue || '--'}}</span>
            </div>
        </div>`,
    props: {
        title: { default: text("Question Text (Markdown)", "What is your **question** about?") }
    },
    data(): {
        selectedValue?: number | undefined
    } {

        return {
            selectedValue: undefined,
        }
    },
    methods: {
        handleChange(value: number | undefined) {
            this.selectedValue = value;
        }
    },
    computed: {
        question(): GapAnalysisQuestion {
            return genericQuestion(this.title);
        }
    }
})