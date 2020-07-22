import Question from "@components/corevalues/Question.vue";
import CoreValuesAssessment from "@shared/models/CoreValuesAssessment";
import CoreValuesAssessmentResponse from "@shared/models/CoreValuesAssessmentResponse";
import CoreValuesQuestion from "@shared/models/CoreValuesQuestion";
import CoreValuesQuestionResponse from "@shared/models/CoreValuesQuestionResponse";
import CoreValuesQuestionOption from "@shared/models/CoreValuesQuestionOption";

export default {
    title: "Core Values/Assessment/Question"
}

export const MultiSelect = () => ({
    template: `
        <question
                :response="response"
                :question="question"
                :options="options"
        />`,
    components: {
        Question,
    },
    data(): {
        options: CoreValuesQuestionOption[],
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
        const options = question.options({
            responses: assessment.orderedResponses(assessmentResponse),
            currentIndex: 0
        });
        return { response, question, options }
    }
})

export const Radio = () => ({
    template: `
        <question :response="response" :question="question" :options="options"/>`,
    components: {
        Question,
    },
    data(): {
        question: CoreValuesQuestion,
        options: CoreValuesQuestionOption[],
        response: CoreValuesQuestionResponse,
    } {
        const assessment = CoreValuesAssessment.default();
        const assessmentResponse = CoreValuesAssessmentResponse.create({
            version: assessment.version,
            memberId: "test"
        })
        const question = assessment.getQuestions(assessmentResponse)[1];
        const response = CoreValuesQuestionResponse.create({ questionId: question.id });
        const options = question.options({
            responses: assessment.orderedResponses(assessmentResponse),
            currentIndex: 1
        });
        return { options, response, question }
    }
})