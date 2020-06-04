import { CoreValue } from "@shared/models/CoreValueTypes";
import CoreValuesQuestion from "@shared/models/CoreValuesQuestion";
import { QuestionType } from "@shared/models/Questions";

export interface ResponseValidation {
    isValid: boolean,
    message?: string,
}

export default class CoreValuesQuestionResponse {
    questionId!: string;
    values: CoreValue[] = [];

    get singleValue(): CoreValue | undefined {
        const [value] = this.values;
        return value;
    }

    /**
     * Add a value to the selected options.
     * @param {CoreValue} value
     * @return {boolean} true if the value was added, false if it was already in the list or could not be added
     */
    addValue(value: CoreValue): boolean {
        if (this.values.includes(value)) {
            return false;
        }
        this.values = [...this.values, value];
        return true;
    }

    /**
     * Remove a value from the list
     * @param {CoreValue} value
     * @return {boolean}  true if the value was removed, false if it was not present
     */
    removeValue(value: CoreValue): boolean {
        const updatedValues = this.values.filter(v => v !== value);
        const removed = updatedValues.length < this.values.length;
        this.values = [...updatedValues];
        return removed
    }

    /**
     * Set a single value. useful for radio style question answers. Will remove any existing values.
     * @param {CoreValue | undefined | null} value
     */
    setSingeValue(value?: CoreValue | undefined | null) {
        if (!value) {
            this.values = [];
        } else {
            this.values = [value];
        }
    }

    contains(value: CoreValue): boolean {
        return this.values.includes(value);
    }

    canSelectMore(question: CoreValuesQuestion): boolean {
        if (question.type !== QuestionType.MULTI_SELECT) {
            return true;
        }
        if (!question.multiSelectLimit) {
            return true;
        }

        return question.multiSelectLimit > this.values.length;
    }

    isValid(question: CoreValuesQuestion): ResponseValidation {
        const result: ResponseValidation = { isValid: true };
        const numValues = this.values.length;
        switch (question.type) {
            case QuestionType.MULTI_SELECT:
                if (question.multiSelectLimit && numValues > question.multiSelectLimit) {
                    result.isValid = false;
                    const word = question.multiSelectMinimum === 1 ? "value" : "values";
                    result.message = `You may only select ${ question.multiSelectLimit } ${ word }`;
                }
                if (question.multiSelectMinimum && numValues < question.multiSelectMinimum) {
                    result.isValid = false;
                    const word = question.multiSelectMinimum === 1 ? "value" : "values";
                    result.message = `Please select at least ${ question.multiSelectMinimum } ${ word }`
                }

                if (question.multiSelectLimit && question.multiSelectMinimum && question.multiSelectLimit === question.multiSelectMinimum && numValues !== question.multiSelectMinimum) {
                    result.isValid = false;
                    const word = question.multiSelectMinimum === 1 ? "value" : "values";
                    result.message = `Please select ${question.multiSelectMinimum} ${word}`;
                }

                break;
            case QuestionType.RADIO:
                if (numValues === 0) {
                    result.isValid = false;
                    result.message = "Please select a value";
                }

                if (numValues > 1) {
                    result.isValid = false;
                    result.message = "You may only select one value";
                }

                break;
        }

        return result;
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