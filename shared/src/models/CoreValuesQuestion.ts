import CoreValuesQuestionOption from "@shared/models/CoreValuesQuestionOption";
import CoreValuesAssessmentResponse from "@shared/models/CoreValuesAssessmentResponse";
import CoreValuesAssessment from "@shared/models/CoreValuesAssessment";

export enum QuestionType {
    RADIO = "RADIO",
    MULTI_SELECT = "MULTI_SELECT"
}

export interface DynamicAssessmentParams {
    assessment?: CoreValuesAssessment
    assessmentResponse?: CoreValuesAssessmentResponse;
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

    protected options: CoreValuesQuestionOption[] = [];

    protected dynamicOptions?: (params?: DynamicAssessmentParams) => CoreValuesQuestionOption[];

    /**
     *
     * @param {{assessment?: CoreValuesAssessment, assessmentResponse?: CoreValuesAssessmentResponse}} params
     * @return {CoreValuesQuestionOption[]}
     */
    getOptions = (params?: DynamicAssessmentParams): CoreValuesQuestionOption[] => {
        if (this.dynamicOptions && params) {
            return this.dynamicOptions(params)
        }
        return this.options;
    };

    /**
     * If this question should show up in the list of questions or not, based on the assessment responses
     * @param  {CoreValuesAssessment} params.assessment
     * @param  {CoreValuesAssessmentResponse} params.assessmentResponse
     * @return {boolean}
     */
    filter = (params?: DynamicAssessmentParams): boolean => {
        return true;
    };

    static create(params: {
        id?: string;
        type: QuestionType;
        multiSelectMinimum?: number;
        multiSelectLimit?: number;
        titleMarkdown?: string;
        descriptionMarkdown?: string;
        options: CoreValuesQuestionOption[],
        filter?: (params?: DynamicAssessmentParams) => boolean
        getOptions?: (params?: DynamicAssessmentParams) => CoreValuesQuestionOption[]
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
        q.options = options;
        q.multiSelectLimit = multiSelectLimit;
        q.multiSelectMinimum = multiSelectMinimum;
        if (filter) {
            q.filter = filter;
        }
        if (getOptions) {
            q.dynamicOptions = getOptions;
        }
        return q;
    }
}
