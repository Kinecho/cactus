import Question, { QuestionType } from "@shared/models/CoreValuesQuestion";
import Option from "@shared/models/CoreValuesQuestionOption";
import { CoreValue } from "@shared/models/CoreValueTypes";
import CoreValuesAssessmentResponse from "@shared/models/CoreValuesAssessmentResponse";
import CoreValuesQuestionResponse from "@shared/models/CoreValuesQuestionResponse";
import { isNull } from "@shared/util/ObjectUtil";

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
     * @type {any[]}
     */
    protected questions: Question[] = [];

    getQuestions(response?: CoreValuesAssessmentResponse): Question[] {
        if (!response) {
            return this.questions;
        }

        return this.questions.filter(q => q.filter({ assessmentResponse: response, assessment: this }));
    }

    orderedResponses(response?: CoreValuesAssessmentResponse): CoreValuesQuestionResponse[] {
        if (!response) {
            return []
        }

        return this.getQuestions(response).flatMap(q => response.getOptionalResponse(q.id)).filter(isNull) as CoreValuesQuestionResponse[];
    }

    previousResponse(response: CoreValuesAssessmentResponse): CoreValuesQuestionResponse|undefined {
        // return this.getQ
        return;
    }

    static default(): CoreValuesAssessment {
        const assessment = new CoreValuesAssessment();
        assessment.questions = DEFAULT_QUESTIONS_V1();
        return assessment;
    }

}

export const DEFAULT_QUESTIONS_V1 = (): Question[] => [
    Question.create({
        // id: "0",
        type: QuestionType.MULTI_SELECT,
        titleMarkdown: "Think of a time when you felt like you had choices and were in control of how to act. "
        + "What values motivated those feelings? [select two:]",
        descriptionMarkdown: "",
        multiSelectLimit: 2,
        multiSelectMinimum: 1,
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
        ]
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
        titleMarkdown: "Think of a time when you felt challenged, but effective, prepared, and adequately resourced. What values helped you feel that way? [select two:]",
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
        titleMarkdown: "Think of a time when you felt you cared for others, or a time when you felt cared for by others, free of ulterior motives. What values made this possible? [select two:]",
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
        titleMarkdown: "Reflecting on your selected values, which do you value as the result of positive, strengthening experiences or decisions:",
        descriptionMarkdown: "",
        multiSelectMinimum: 2,
        multiSelectLimit: 8,
        filter: (response) => {
            return true;
        },
        options: [
            Option.create({ value: CoreValue.Accountability }),
            Option.create({ value: CoreValue.HolisticLiving }),
            Option.create({ value: CoreValue.Integrity }),
            Option.create({ value: CoreValue.Joy }),
            Option.create({ value: CoreValue.Respect }),
        ]
    }),
].map((q, index) => {
    q.id = q.id ?? `${ index }`;
    return q
});