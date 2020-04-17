import CoreValuesQuestionOption from "@shared/models/CoreValuesQuestionOption";

export enum QuestionType {
    RADIO = "RADIO",
    MULTI_SELECT = "MULTI_SELECT"
}

export default class CoreValuesQuestion {
    id!: string;
    titleMarkdown?: string;
    descriptionMarkdown?: string;
    type: QuestionType = QuestionType.MULTI_SELECT;

    /**
     * Minimum number of selections for a multi select question
     * @type {number}
     */
    multiSelectMinimum?: number = 0;
    /**
     * Limit the number of multi select answers a user can choose
     * @type {number}
     */
    multiSelectLimit?: number = 1;

    options: CoreValuesQuestionOption[] = [];

    static create(params: {
        id?: string;
        type: QuestionType;
        multiSelectMinimum?: number;
        multiSelectLimit?: number;
        titleMarkdown?: string;
        descriptionMarkdown?: string;
        options: CoreValuesQuestionOption[],
    }): CoreValuesQuestion {
        const {
            id,
            type,
            titleMarkdown,
            descriptionMarkdown,
            options,
            multiSelectMinimum,
            multiSelectLimit
        } = params;
        const q = new CoreValuesQuestion();
        if (id) {
            q.id = id;
        }
        q.type = type;
        q.titleMarkdown = titleMarkdown;
        q.descriptionMarkdown = descriptionMarkdown;
        q.options = options;
        q.multiSelectLimit = multiSelectLimit;
        q.multiSelectMinimum = multiSelectMinimum;
        return q;
    }
}
