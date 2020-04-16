import { CoreValue, CoreValuesService } from "@shared/models/CoreValueTypes";

export default class CoreValuesQuestionOption {
    title?: string;
    description?: string;

    /**
     * The value to associate with this answer
     * @type {string}
     */
    value!: string;

    static create(params: { title?: string, description?: string, value: CoreValue }): CoreValuesQuestionOption {
        const { title, description, value } = params;
        const option = new CoreValuesQuestionOption();
        option.title = title ?? CoreValuesService.shared.getMeta(value).title;
        option.description = description ?? CoreValuesService.shared.getMeta(value).description;
        option.value = value;
        return option;
    }
}