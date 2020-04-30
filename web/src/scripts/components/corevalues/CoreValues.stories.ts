import Question from "@components/corevalues/Question.vue";
import CoreValuesAssessment from "@shared/models/CoreValuesAssessment";
import CoreValuesAssessmentResponse from "@shared/models/CoreValuesAssessmentResponse";
import CoreValuesQuestion, { QuestionType } from "@shared/models/CoreValuesQuestion";
import CoreValuesQuestionResponse from "@shared/models/CoreValuesQuestionResponse";
import QuestionOption from "@components/corevalues/QuestionOption.vue";
import CoreValuesQuestionOption from "@shared/models/CoreValuesQuestionOption";
import { CoreValue } from "@shared/models/CoreValueTypes";

export default {
    title: "Core Values"
}

export const OptionRadioEnabled = () => ({
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

export const OptionRadioDisabled = () => ({
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

export const QuestionMultiSelect = () => ({
    template: `
        <question :assessment="assessment" :assessment-response="assessmentResponse" :response="response" :question="question"/>`,
    components: {
        Question,
    },
    data(): {
        assessment: CoreValuesAssessment,
        assessmentResponse: CoreValuesAssessmentResponse,
        question: CoreValuesQuestion,
        response: CoreValuesQuestionResponse,
    } {
        const assessment = CoreValuesAssessment.default();
        const assessmentResponse = CoreValuesAssessmentResponse.create({
            version: assessment.version,
            memberId: "test"
        })
        const question = assessment.getQuestions(assessmentResponse)[0];
        const response = CoreValuesQuestionResponse.create({ questionId: question.id });
        return { assessment, response, question, assessmentResponse }
    }
})

export const QuestionRadio = () => ({
    template: `
        <question :assessment="assessment" :assessment-response="assessmentResponse" :response="response" :question="question"/>`,
    components: {
        Question,
    },
    data(): {
        assessment: CoreValuesAssessment,
        assessmentResponse: CoreValuesAssessmentResponse,
        question: CoreValuesQuestion,
        response: CoreValuesQuestionResponse,
    } {
        const assessment = CoreValuesAssessment.default();
        const assessmentResponse = CoreValuesAssessmentResponse.create({
            version: assessment.version,
            memberId: "test"
        })
        const question = assessment.getQuestions(assessmentResponse)[1];
        const response = CoreValuesQuestionResponse.create({ questionId: question.id });
        return { assessment, response, question, assessmentResponse }
    }
})