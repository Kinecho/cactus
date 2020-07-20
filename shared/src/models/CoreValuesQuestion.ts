import CoreValuesQuestionOption from "@shared/models/CoreValuesQuestionOption";
import Logger from "@shared/Logger";
import { QuestionType } from "@shared/models/Questions";
import CoreValuesQuestionResponse from "@shared/models/CoreValuesQuestionResponse";

export interface DynamicAssessmentParams {
    responses: CoreValuesQuestionResponse[],
    currentIndex: number,
}

export default class CoreValuesQuestion {
    id!: string;
    titleMarkdown?: string;
    descriptionMarkdown?: string;
    logger = new Logger("CoreValuesQuestion");
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

    protected _options: CoreValuesQuestionOption[] = [];

    protected dynamicOptions?: (params: DynamicAssessmentParams, question: CoreValuesQuestion) => CoreValuesQuestionOption[] | undefined;

    /**
     *
     * @param {DynamicAssessmentParams} params
     * @return {CoreValuesQuestionOption[]}
     */
    options = (params: DynamicAssessmentParams): CoreValuesQuestionOption[] => {
        if (this.dynamicOptions) {
            this.logger.info("Getting dynamic options");
            return this.dynamicOptions(params, this) ?? this._options;
        }
        return this._options;
    };

    protected _filter?: (params: DynamicAssessmentParams, question: CoreValuesQuestion) => boolean;

    /**
     * If this question should show up in the list of questions or not, based on the assessment responses
     * @param  {CoreValuesAssessment} params.assessment
     * @param  {CoreValuesAssessmentResponse} params.assessmentResponse
     * @return {boolean}
     */
    filter = (params: DynamicAssessmentParams): boolean => {
        return this._filter?.(params, this) ?? true
    };

    static create(params: {
        id?: string;
        type: QuestionType;
        multiSelectMinimum?: number;
        multiSelectLimit?: number;
        titleMarkdown?: string;
        descriptionMarkdown?: string;
        options: CoreValuesQuestionOption[],
        filter?: (params: DynamicAssessmentParams, question: CoreValuesQuestion) => boolean
        getOptions?: (params: DynamicAssessmentParams, question: CoreValuesQuestion) => CoreValuesQuestionOption[] | undefined
    }): CoreValuesQuestion {
        const {
            id,
            type,
            titleMarkdown,
            descriptionMarkdown,
            options,
            multiSelectMinimum,
            multiSelectLimit,
            filter,
            getOptions,
        } = params;
        const q = new CoreValuesQuestion();
        if (id) {
            q.id = id;
        }
        q.type = type;
        q.titleMarkdown = titleMarkdown;
        q.descriptionMarkdown = descriptionMarkdown;
        q._options = options;
        q.multiSelectLimit = multiSelectLimit;
        q.multiSelectMinimum = multiSelectMinimum;
        if (filter) {
            q._filter = filter;
        }
        if (getOptions) {
            q.dynamicOptions = getOptions;
        }
        return q;
    }
}
