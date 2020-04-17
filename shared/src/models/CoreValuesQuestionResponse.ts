import { CoreValue } from "@shared/models/CoreValueTypes";

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