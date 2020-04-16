import { BaseModel, Collection } from "@shared/FirestoreBaseModels";
import CoreValuesQuestionResponse from "@shared/models/CoreValuesQuestionResponse";

export default class CoreValuesAssessmentResponse extends BaseModel {
    readonly collection = Collection.coreValuesAssessmentResponses;

    /**
     * The version of the assessment that was taken.
     */
    assessmentVersion!: string;

    questionResponses: { [questionId: string]: CoreValuesQuestionResponse } = {};

    static create(params: { version: string }) {
        const { version } = params;
        const assessment = new CoreValuesAssessmentResponse();
        assessment.assessmentVersion = version;
        return assessment;
    }

    setResponse(response: CoreValuesQuestionResponse) {
        this.questionResponses[response.questionId] = response;
    }

    /**
     * Returns existing response to a given question ID, or creates a new empty response object
     * @param {string} questionId
     * @return {CoreValuesQuestionResponse}
     */
    getResponseForQuestion(questionId: string): CoreValuesQuestionResponse {
        return this.questionResponses[questionId] ?? CoreValuesQuestionResponse.create({ questionId });
    }

}