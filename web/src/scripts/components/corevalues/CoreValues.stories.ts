import Question from "@components/corevalues/Question.vue";
import CoreValuesAssessment from "@shared/models/CoreValuesAssessment";
import CoreValuesAssessmentResponse from "@shared/models/CoreValuesAssessmentResponse";
import CoreValuesQuestion from "@shared/models/CoreValuesQuestion";
import CoreValuesQuestionResponse from "@shared/models/CoreValuesQuestionResponse";

export default {
    title: "Core Values"
}

export const BasicQuestion = () => ({
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