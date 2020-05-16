import QuestionOption from "@components/corevalues/QuestionOption.vue";
import CoreValuesQuestionOption from "@shared/models/CoreValuesQuestionOption";
import { CoreValue } from "@shared/models/CoreValueTypes";
import { boolean, text } from "@storybook/addon-knobs";
import Vue from "vue";
import { QuestionType } from "@shared/models/Questions";

export default {
    title: "Core Values/Assessment/Question/Option",
}

export const RadioEnabled = () => ({
    template: `
        <question-option type="RADIO"
                :selected="true"
                :title="option.title"
                :disabled="false"
                :option="option"
                @removed="selected = false"
                @selected="selected = true"/>`,
    components: {
        QuestionOption
    },
    data(): { option: CoreValuesQuestionOption, questionType: QuestionType, selected: boolean } {
        return {
            questionType: QuestionType.RADIO,
            option: CoreValuesQuestionOption.create({
                title: "Option Title Goes Here",
                value: CoreValue.Abundance,
                description: "This is a custom description that goes along with the option"
            }),
            selected: true,
        }
    }
})

export const RadioDisabled = () => Vue.extend({
    template: `
        <question-option :type="questionType" :selected="selected" :disabled="true" :option="option" @removed="selected = false" @selected="selected = true"/>`,
    components: {
        QuestionOption
    },
    props: {
        selected: {
            type: Boolean,
            default: boolean('Selected', true)
        },
        title: {
            type: String,
            default: text("Title", "This is the option title"),
        },
        description: {
            type: String,
            default: text("Description", "This is the option description"),
        }
    },
    data(): { questionType: QuestionType, initialOption: CoreValuesQuestionOption } {
        return {
            questionType: QuestionType.RADIO,
            initialOption: CoreValuesQuestionOption.create({
                title: "Option Title Goes Here",
                value: CoreValue.Abundance,
                description: "Sample description",
            })
        }
    },
    computed: {
        option(): CoreValuesQuestionOption {
            const option = this.initialOption;
            option.title = this.title;
            option.description = this.description;
            return option;
        }
    }
})
