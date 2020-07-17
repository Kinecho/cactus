import { BaseModel, Collection } from "@shared/FirestoreBaseModels";
import CoreValuesQuestionResponse from "@shared/models/CoreValuesQuestionResponse";
import { toPlainObject } from "@shared/util/ObjectUtil";
import { CoreValue } from "@shared/models/CoreValueTypes";
import { CoreValuesBlob, getCoreValuesBlob } from "@shared/util/CoreValuesUtil";

enum Field {
    memberId = "memberId",
    completed = "completed",
    results = "results",
}

export interface CoreValuesResults {
    values: CoreValue[];
}

export default class CoreValuesAssessmentResponse extends BaseModel {
    readonly collection = Collection.coreValuesAssessmentResponses;
    static Fields = Field;
    /**
     * The version of the assessment that was taken.
     */
    assessmentVersion!: string;
    memberId!: string;
    completed: boolean = false;
    questionResponses: { [questionId: string]: CoreValuesQuestionResponse } = {};

    results?: CoreValuesResults;

    /**
     * All of the response values, deduplicated
     * @return {CoreValue[]}
     */
    get allResponseValues(): CoreValue[] {
        const coreValues = Object.values(this.questionResponses).flatMap(r => r.values);
        return [...new Set(coreValues)]
    }

    get allResponses(): CoreValuesQuestionResponse[] {
        return Object.values(this.questionResponses);
    }

    prepareForFirestore(): any {
        // const data = super.prepareForFirestore();
        // return stringifyJSON(data);
        const data = toPlainObject({ ...this });
        data.questionResponses = JSON.parse(JSON.stringify(this.questionResponses));
        return data;
    }

    prepareFromFirestore(data: any): any {
        // const  super.prepareFromFirestore(data);
        Object.keys(data.questionResponses).forEach(key => {
            const input = data.questionResponses[key];
            const model = Object.assign(new CoreValuesQuestionResponse(), { ...input });

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
        this.questionResponses = {
            ...this.questionResponses,
            [response.questionId]: response
        };
    }

    /**
     * Returns existing response to a given question ID, or creates a new empty response object
     * @param {string} questionId
     * @return {CoreValuesQuestionResponse}
     */
    getResponseForQuestion(questionId: string): CoreValuesQuestionResponse {
        return this.questionResponses[questionId] ?? CoreValuesQuestionResponse.create({ questionId });
    }

    getOptionalResponse(questionId: string): CoreValuesQuestionResponse | undefined {
        return this.questionResponses[questionId];
    }

    copy(): CoreValuesAssessmentResponse {
        const c = new CoreValuesAssessmentResponse();
        Object.assign(c, this);
        return c;
    }

    getBlob(forceIndex?: number | null | undefined | string): CoreValuesBlob | undefined {
        if ((this.results?.values ?? []).length === 0) {
            return undefined;
        }
        return getCoreValuesBlob(this.results?.values, forceIndex)
    }
}