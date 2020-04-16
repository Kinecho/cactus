import Question, { QuestionType } from "@shared/models/CoreValuesQuestion";
import Option from "@shared/models/CoreValuesQuestionOption";
import { CoreValue } from "@shared/models/CoreValueTypes";

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
    questions: Question[] = [];

    static default(): CoreValuesAssessment {
        const assessment = new CoreValuesAssessment();
        assessment.questions = DEFAULT_QUESTIONS_V1();
        return assessment;
    }

}

export const DEFAULT_QUESTIONS_V1 = (): Question[] => [
    Question.create({
        id: "1",
        type: QuestionType.MULTI_SELECT,
        titleMarkdown: "Think of a time when you felt like you had choices and were in control of how to act. "
        + "What values motivated those feelings? [select two:]",
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
        id: "2",
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
        id: "3",
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
    })
];