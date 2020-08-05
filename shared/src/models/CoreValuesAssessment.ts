import Question, { DynamicAssessmentParams } from "@shared/models/CoreValuesQuestion";
import Option from "@shared/models/CoreValuesQuestionOption";
import { CoreValue } from "@shared/models/CoreValueTypes";
import CoreValuesAssessmentResponse, { CoreValuesResults } from "@shared/models/CoreValuesAssessmentResponse";
import CoreValuesQuestionResponse from "@shared/models/CoreValuesQuestionResponse";
import { isNotNull } from "@shared/util/ObjectUtil";
import { QuestionType } from "@shared/models/Questions";

export default class CoreValuesAssessment {
    /**
     * The version of the assessment. For admin purposes.
     * @type {string}
     */
    version = "v1";
    /**
     * The last update timestamp of the assessment version. For Admin purposes only.
     * @type {string}
     */
    lastModified = "2020-04-16";

    /**
     * The questions of the assessment.
     * @type {CoreValuesQuestion[]}
     */
    protected questions: Question[] = [];

    getQuestions(response?: CoreValuesAssessmentResponse | null): Question[] {
        // if (!response) {
        //     return this.questions;
        // }

        return this.questions.filter((q, index) => {
            const responses = this.orderedResponses(response)
            return q.filter({ responses, currentIndex: index, })
        });
    }

    orderedResponses(assessmentResponse?: CoreValuesAssessmentResponse|null): CoreValuesQuestionResponse[] {
        if (!assessmentResponse) {
            return []
        }

        return this.questions.flatMap(q => assessmentResponse.getOptionalResponse(q.id)).filter(isNotNull) as CoreValuesQuestionResponse[] ?? [];
    }

    questionIndex(questionId: string): number {
        return this.questions.findIndex(question => question.id === questionId);
    }

    /**
     * Given a question, fetch the previous response
     * @param {CoreValuesAssessmentResponse} assessmentResponse
     * @param {CoreValuesQuestion} question
     * @return {CoreValuesQuestionResponse | undefined}
     */
    previousResponse(assessmentResponse: CoreValuesAssessmentResponse, question: Question): CoreValuesQuestionResponse | undefined {
        // return this.getQ
        const responses = this.orderedResponses(assessmentResponse);
        if (responses.length < 2) {
            return;
        }

        const currentQuestion = this.questionIndex(question.id);
        if (currentQuestion < 1) {
            return;
        }
        const previousQuestion = this.questions[currentQuestion - 1];
        return assessmentResponse.getOptionalResponse(previousQuestion.id);
    }

    lastResponse(assessmentResponse: CoreValuesAssessmentResponse): CoreValuesQuestionResponse | undefined {
        const responses = this.orderedResponses(assessmentResponse);
        if (responses.length === 0) {
            return undefined;
        }
        return responses[responses.length - 1];
    }

    getResults(assessmentResponse: CoreValuesAssessmentResponse): CoreValuesResults | undefined {
        const response = this.lastResponse(assessmentResponse);
        if (!response) {
            return undefined;
        }

        return {
            values: response.values
        };
    }

    static default(): CoreValuesAssessment {
        const assessment = new CoreValuesAssessment();
        assessment.questions = DEFAULT_QUESTIONS_V1();
        return assessment;
    }

    static onboarding(): CoreValuesAssessment {
        const assessment = new CoreValuesAssessment();
        assessment.version = "v1-mini"
        assessment.questions = MAGIC_CORE_VALUES_ONBOARDING_QUESTIONS()
        return assessment;
    }

}

function getAllPreviousValues(params: DynamicAssessmentParams, question: Question): Option[] {
    const { responses, currentIndex } = params;

    return responses.slice(0, currentIndex).flatMap(r => r.values).map(value => Option.create({ value }));
}

function getPreviousResultOptions(params: DynamicAssessmentParams, question: Question): Option[] {
    const { responses, currentIndex } = params;
    const previousIndex = currentIndex - 1;

    if (responses.length <= previousIndex) {
        return []
    }

    const previousResponse = responses[previousIndex]
    if (!previousResponse) {
        return []
    }
    return previousResponse.values.map(value => Option.create({ value }));
}

export const DEFAULT_QUESTIONS_V1 = (): Question[] => [
    Question.create({
        // id: "0",
        type: QuestionType.MULTI_SELECT,
        titleMarkdown: "Think of a time when you felt like you had choices and were in control of how to act. "
        + "What values motivated those feelings? **Select two:**",
        descriptionMarkdown: "",
        multiSelectLimit: 2,
        multiSelectMinimum: 2,
        options: [
            Option.create({ value: CoreValue.Adventure }),
            Option.create({ value: CoreValue.Autonomy }),
            Option.create({ value: CoreValue.Flexibility }),
            Option.create({ value: CoreValue.Freedom }),
            Option.create({ value: CoreValue.PersonalGrowth }),
            Option.create({ value: CoreValue.SelfExpression }),
            Option.create({ value: CoreValue.SelfReliance }),
            Option.create({ value: CoreValue.Stewardship }),
            Option.create({ value: CoreValue.Trust }),
            Option.create({ value: CoreValue.Vision }),
        ],
    }),
    Question.create({
        // id: "1",
        type: QuestionType.RADIO,
        titleMarkdown: "Which **one** of these is the most active value in your life?",
        descriptionMarkdown: "",
        options: [
            Option.create({ value: CoreValue.Clarity }),
            Option.create({ value: CoreValue.SelfCare }),
            Option.create({ value: CoreValue.Appearance }),
            Option.create({ value: CoreValue.Personal }),
            Option.create({ value: CoreValue.Humor }),
        ],
    }),
    Question.create({
        // id: "2",
        type: QuestionType.RADIO,
        titleMarkdown: "Which **one** of these is the most active value in your life?",
        descriptionMarkdown: "",
        options: [
            Option.create({ value: CoreValue.Commitment }),
            Option.create({ value: CoreValue.Altruism }),
            Option.create({ value: CoreValue.Nature }),
            Option.create({ value: CoreValue.Security }),
            Option.create({ value: CoreValue.Power }),
        ]
    }),
    Question.create({
        // id: "3",
        type: QuestionType.MULTI_SELECT,
        titleMarkdown: "Think of a time when you felt challenged, but effective, prepared, and adequately resourced. What values helped you feel that way? **Select two:**",
        descriptionMarkdown: "",
        multiSelectMinimum: 2,
        multiSelectLimit: 2,
        options: [
            Option.create({ value: CoreValue.Fulfillment }),
            Option.create({ value: CoreValue.Accomplishment }),
            Option.create({ value: CoreValue.Achievement }),
            Option.create({ value: CoreValue.Growth }),
            Option.create({ value: CoreValue.Leadership }),
            Option.create({ value: CoreValue.Professionalism }),
            Option.create({ value: CoreValue.Recognition }),
            Option.create({ value: CoreValue.SelfRealization }),
            Option.create({ value: CoreValue.Success }),
            Option.create({ value: CoreValue.Truth }),
        ]
    }),
    Question.create({
        // id: "4",
        type: QuestionType.RADIO,
        titleMarkdown: "Which **one** of these is the most active value in your life?",
        descriptionMarkdown: "",
        options: [
            Option.create({ value: CoreValue.Vitality }),
            Option.create({ value: CoreValue.Grace }),
            Option.create({ value: CoreValue.Fun }),
            Option.create({ value: CoreValue.Orderliness }),
            Option.create({ value: CoreValue.Honesty }),
        ]
    }),
    Question.create({
        // id: "5",
        type: QuestionType.RADIO,
        titleMarkdown: "Which **one** of these is the most active value in your life?",
        descriptionMarkdown: "",
        options: [
            Option.create({ value: CoreValue.Abundance }),
            Option.create({ value: CoreValue.Energy }),
            Option.create({ value: CoreValue.Creativity }),
            Option.create({ value: CoreValue.Privacy }),
            Option.create({ value: CoreValue.Openness }),
        ]
    }),
    Question.create({
        // id: "6",
        type: QuestionType.MULTI_SELECT,
        titleMarkdown: "Think of a time when you felt you cared for others, or a time when you felt cared for by others, free of ulterior motives. What values made this possible? **Select two:**",
        descriptionMarkdown: "",
        multiSelectMinimum: 2,
        multiSelectLimit: 2,
        options: [
            Option.create({ value: CoreValue.Communication }),
            Option.create({ value: CoreValue.Community }),
            Option.create({ value: CoreValue.ConnectingToOthers }),
            Option.create({ value: CoreValue.Empathy }),
            Option.create({ value: CoreValue.Family }),
            Option.create({ value: CoreValue.Friendship }),
            Option.create({ value: CoreValue.Intimacy }),
            Option.create({ value: CoreValue.Loyalty }),
            Option.create({ value: CoreValue.Partnership }),
            Option.create({ value: CoreValue.Service }),
            Option.create({ value: CoreValue.Romance }),
        ]
    }),
    Question.create({
        // id: "7",
        type: QuestionType.RADIO,
        titleMarkdown: "Which **one** of these is the most active value in your life?",
        descriptionMarkdown: "",
        options: [
            Option.create({ value: CoreValue.Calm }),
            Option.create({ value: CoreValue.Originality }),
            Option.create({ value: CoreValue.MentalHealth }),
            Option.create({ value: CoreValue.Beauty }),
            Option.create({ value: CoreValue.Structure }),
        ],
    }),
    Question.create({
        // id: "8",
        type: QuestionType.RADIO,
        titleMarkdown: "Which **one** of these is the most active value in your life?",
        descriptionMarkdown: "",
        options: [
            Option.create({ value: CoreValue.Accountability }),
            Option.create({ value: CoreValue.HolisticLiving }),
            Option.create({ value: CoreValue.Integrity }),
            Option.create({ value: CoreValue.Joy }),
            Option.create({ value: CoreValue.Respect }),
        ]
    }),
    Question.create({
        // id: "9",
        type: QuestionType.MULTI_SELECT,
        titleMarkdown: "Reflecting on your selected values, which do you value as the result of positive, strengthening experiences or decisions? **Select 2-8:**",
        descriptionMarkdown: "",
        multiSelectMinimum: 2,
        multiSelectLimit: 8,
        filter: (response) => {
            return true;
        },
        options: [],
        getOptions: (params, question) => {
            return getAllPreviousValues(params, question);
        }
    }),
    Question.create({
        // id: "10",
        type: QuestionType.MULTI_SELECT,
        titleMarkdown: "Reflect on important life decisions you’ve made, then select which of the values were at the heart of those decisions. **Select 2-4:**",
        descriptionMarkdown: "",
        multiSelectMinimum: 2,
        multiSelectLimit: 4,
        filter: (params, question) => {
            const results = getPreviousResultOptions(params, question);
            return (results?.length ?? 0) > 2;
        },
        options: [],
        getOptions: (params, question) => {
            return getPreviousResultOptions(params, question);
        }
    }),
].map((q, index) => {
    q.id = q.id ?? `${ index }`;
    return q
});


export const MAGIC_CORE_VALUES_ONBOARDING_QUESTIONS = (): Question[] => [
    Question.create({
        // id: "0",
        type: QuestionType.MULTI_SELECT,
        titleMarkdown: "Think of a time when you felt like you were in control of how to act."
        + "What motivated those feelings? **Select two:**",
        descriptionMarkdown: "",
        multiSelectLimit: 2,
        multiSelectMinimum: 2,
        options: [
            Option.create({ value: CoreValue.Adventure }),
            Option.create({ value: CoreValue.Autonomy }),
            Option.create({ value: CoreValue.Flexibility }),
            Option.create({ value: CoreValue.Freedom }),
            Option.create({ value: CoreValue.PersonalGrowth }),
            Option.create({ value: CoreValue.SelfExpression }),
            Option.create({ value: CoreValue.SelfReliance }),
            Option.create({ value: CoreValue.Stewardship }),
            Option.create({ value: CoreValue.Trust }),
            Option.create({ value: CoreValue.Vision }),
        ],
    }),
    Question.create({
        // id: "1",
        type: QuestionType.MULTI_SELECT,
        titleMarkdown: "Think of a time when you felt challenged, but prepared and adequately resourced."
        + "What helped you feel that way? **Select two:**",
        descriptionMarkdown: "",
        multiSelectLimit: 2,
        multiSelectMinimum: 2,
        options: [
            Option.create({ value: CoreValue.Fulfillment }),
            Option.create({ value: CoreValue.Accomplishment }),
            Option.create({ value: CoreValue.Achievement }),
            Option.create({ value: CoreValue.Growth }),
            Option.create({ value: CoreValue.Leadership }),
            Option.create({ value: CoreValue.Professionalism }),
            Option.create({ value: CoreValue.Recognition }),
            Option.create({ value: CoreValue.SelfRealization }),
            Option.create({ value: CoreValue.Success }),
            Option.create({ value: CoreValue.Truth }),
        ],
    }),
    // Question.create({
    //     // id: "2",
    //     type: QuestionType.RADIO,
    //     titleMarkdown: "Which **one** of these is the most active value in your life?",
    //     descriptionMarkdown: "",
    //     options: [
    //         Option.create({ value: CoreValue.Commitment }),
    //         Option.create({ value: CoreValue.Altruism }),
    //         Option.create({ value: CoreValue.Nature }),
    //         Option.create({ value: CoreValue.Security }),
    //         Option.create({ value: CoreValue.Power }),
    //     ]
    // }),
    // Question.create({
    //     // id: "3",
    //     type: QuestionType.MULTI_SELECT,
    //     titleMarkdown: "Think of a time when you felt challenged, but effective, prepared, and adequately resourced. What values helped you feel that way? **Select two:**",
    //     descriptionMarkdown: "",
    //     multiSelectMinimum: 2,
    //     multiSelectLimit: 2,
    //     options: [
    //         Option.create({ value: CoreValue.Fulfillment }),
    //         Option.create({ value: CoreValue.Accomplishment }),
    //         Option.create({ value: CoreValue.Achievement }),
    //         Option.create({ value: CoreValue.Growth }),
    //         Option.create({ value: CoreValue.Leadership }),
    //         Option.create({ value: CoreValue.Professionalism }),
    //         Option.create({ value: CoreValue.Recognition }),
    //         Option.create({ value: CoreValue.SelfRealization }),
    //         Option.create({ value: CoreValue.Success }),
    //         Option.create({ value: CoreValue.Truth }),
    //     ]
    // }),
    // Question.create({
    //     // id: "4",
    //     type: QuestionType.RADIO,
    //     titleMarkdown: "Which **one** of these is the most active value in your life?",
    //     descriptionMarkdown: "",
    //     options: [
    //         Option.create({ value: CoreValue.Vitality }),
    //         Option.create({ value: CoreValue.Grace }),
    //         Option.create({ value: CoreValue.Fun }),
    //         Option.create({ value: CoreValue.Orderliness }),
    //         Option.create({ value: CoreValue.Honesty }),
    //     ]
    // }),
    // Question.create({
    //     // id: "5",
    //     type: QuestionType.RADIO,
    //     titleMarkdown: "Which **one** of these is the most active value in your life?",
    //     descriptionMarkdown: "",
    //     options: [
    //         Option.create({ value: CoreValue.Abundance }),
    //         Option.create({ value: CoreValue.Energy }),
    //         Option.create({ value: CoreValue.Creativity }),
    //         Option.create({ value: CoreValue.Privacy }),
    //         Option.create({ value: CoreValue.Openness }),
    //     ]
    // }),
    // Question.create({
    //     // id: "6",
    //     type: QuestionType.MULTI_SELECT,
    //     titleMarkdown: "Think of a time when you felt you cared for others, or a time when you felt cared for by others, free of ulterior motives. What values made this possible? **Select two:**",
    //     descriptionMarkdown: "",
    //     multiSelectMinimum: 2,
    //     multiSelectLimit: 2,
    //     options: [
    //         Option.create({ value: CoreValue.Communication }),
    //         Option.create({ value: CoreValue.Community }),
    //         Option.create({ value: CoreValue.ConnectingToOthers }),
    //         Option.create({ value: CoreValue.Empathy }),
    //         Option.create({ value: CoreValue.Family }),
    //         Option.create({ value: CoreValue.Friendship }),
    //         Option.create({ value: CoreValue.Intimacy }),
    //         Option.create({ value: CoreValue.Loyalty }),
    //         Option.create({ value: CoreValue.Partnership }),
    //         Option.create({ value: CoreValue.Service }),
    //         Option.create({ value: CoreValue.Romance }),
    //     ]
    // }),
    // Question.create({
    //     // id: "7",
    //     type: QuestionType.RADIO,
    //     titleMarkdown: "Which **one** of these is the most active value in your life?",
    //     descriptionMarkdown: "",
    //     options: [
    //         Option.create({ value: CoreValue.Calm }),
    //         Option.create({ value: CoreValue.Originality }),
    //         Option.create({ value: CoreValue.MentalHealth }),
    //         Option.create({ value: CoreValue.Beauty }),
    //         Option.create({ value: CoreValue.Structure }),
    //     ],
    // }),
    // Question.create({
    //     // id: "8",
    //     type: QuestionType.RADIO,
    //     titleMarkdown: "Which **one** of these is the most active value in your life?",
    //     descriptionMarkdown: "",
    //     options: [
    //         Option.create({ value: CoreValue.Accountability }),
    //         Option.create({ value: CoreValue.HolisticLiving }),
    //         Option.create({ value: CoreValue.Integrity }),
    //         Option.create({ value: CoreValue.Joy }),
    //         Option.create({ value: CoreValue.Respect }),
    //     ]
    // }),
    Question.create({
        // id: "9",
        type: QuestionType.RADIO,
        titleMarkdown: "Which one of these do you believe is the result of positive, strengthening experiences?",
        descriptionMarkdown: "",
        options: [],
        getOptions: (params, question) => {
            return getAllPreviousValues(params, question);
        }
    }),
].map((q, index) => {
    q.id = q.id ?? `${ index }`;
    return q
});
