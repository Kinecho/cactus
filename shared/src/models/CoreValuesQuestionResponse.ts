import { CoreValue } from "@shared/models/CoreValueTypes";

export default class CoreValuesQuestionResponse {
    questionId!: string;
    values: CoreValue[] = [];

    get singleValue(): CoreValue|undefined {
        const [value] = this.values;
        return value;
    }

    static create(params: { questionId: string, value?: CoreValue, values?: CoreValue[] }): CoreValuesQuestionResponse {
        const response = new CoreValuesQuestionResponse();
        const { questionId, value, values } = params;
        response.questionId = questionId;

        if (value) {
            response.values = [value]
        } else if (values) {
            response.values = values;
        }

        return response;
    }
}