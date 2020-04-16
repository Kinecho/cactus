import { BaseModel, Collection } from "@shared/FirestoreBaseModels";
import CoreValuesQuestionResponse from "@shared/models/CoreValuesQuestionResponse";
import { toPlainObject } from "@shared/util/ObjectUtil";

export default class CoreValuesAssessmentResponse extends BaseModel {
    readonly collection = Collection.coreValuesAssessmentResponses;

    /**
     * The version of the assessment that was taken.
     */
    assessmentVersion!: string;
    memberId!: string;

    questionResponses: { [questionId: string]: CoreValuesQuestionResponse } = {};

    prepareForFirestore(): any {
        // const data = super.prepareForFirestore();
        // return stringifyJSON(data);
        let data = toPlainObject({...this});
        data.questionResponses = JSON.parse(JSON.stringify(this.questionResponses));
        return data;
    }

    prepareFromFirestore(data: any): any {
        // const  super.prepareFromFirestore(data);
        Object.keys(data.questionResponses).forEach(key => {
            const input = data.questionResponses[key];
            const model = Object.assign(new CoreValuesQuestionResponse(), {...input});

            data.questionResponses[key] = model;
        });

        return data;
    }

    static create(params: { version: string, memberId: string }) {
        const { version, memberId } = params;
        const assessment = new CoreValuesAssessmentResponse();
        assessment.memberId = memberId;
        assessment.assessmentVersion = version;
        return assessment;
    }

    setResponse(response: CoreValuesQuestionResponse) {
        this.questionResponses = { ...this.questionResponses, [response.questionId]: response };
    }

    /**
     * Returns existing response to a given question ID, or creates a new empty response object
     * @param {string} questionId
     * @return {CoreValuesQuestionResponse}
     */
    getResponseForQuestion(questionId: string): CoreValuesQuestionResponse {
        return this.questionResponses[questionId] ?? CoreValuesQuestionResponse.create({ questionId });
    }


    copy(): CoreValuesAssessmentResponse {
        const c = new CoreValuesAssessmentResponse();
        Object.assign(c, this);
        return c;
    }
}