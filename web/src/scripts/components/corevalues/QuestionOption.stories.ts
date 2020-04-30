import { QuestionType } from "@shared/models/CoreValuesQuestion";
import QuestionOption from "@components/corevalues/QuestionOption.vue";
import CoreValuesQuestionOption from "@shared/models/CoreValuesQuestionOption";
import { CoreValue } from "@shared/models/CoreValueTypes";

export default {
    title: "Core Values/Assessment/Question/Option"
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


// storiesOf("Core Values", module).add("Option - Radio - Enabled", OptionRadioEnabled);
// OptionRadioDisabled.story = {
//     name: "Option - Radio - Disabled"
// }
export const RadioDisabled = () => ({
    template: `
        <question-option :type="questionType" :selected="true" :title="option.title" :disabled="true" :option="option" @removed="selected = false" @selected="selected = true"/>`,
    components: {
        QuestionOption
    },
    data(): { questionType: QuestionType, option: CoreValuesQuestionOption, selected: boolean } {
        return {
            questionType: QuestionType.RADIO,
            selected: false,
            option: CoreValuesQuestionOption.create({
                title: "Option Title Goes Here",
                value: CoreValue.Abundance,
                description: ""
            })
        }
    }
})
