import Question, { GapType } from "@shared/models/GapAnalysisQuestion";
import { CactusElement } from "@shared/models/CactusElement";
import { isNull } from "@shared/util/ObjectUtil";

export default class GapAnalysisAssessment {
    /**
     * The version of the assessment. For admin purposes.
     * @type {string}
     */
    version = "v1";
    /**
     * The last update timestamp of the assessment version. For Admin purposes only.
     * @type {string}
     */
    lastModified = "2020-04-30";

    questions: Question[] = [];

    questionByIndex(index?: number): Question | undefined {
        if (isNull(index) || index === null || index === undefined) {
            return undefined;
        }
        if (index >= this.questions.length) {
            return undefined;
        }
        return this.questions[index]
    }

    addQuestion(question: Question): GapAnalysisAssessment {
        question.id = `${ this.questions.length }`
        this.questions.push(question);

        return this;
    }

    static create(): GapAnalysisAssessment {
        const assessment = new GapAnalysisAssessment();
        assessment.questions = DEFAULT_QUESTIONS_V1();

        return assessment;
    }
}

const DEFAULT_QUESTIONS_V1 = (): Question[] => {
    return [
        //0
        Question.create({
            title: "You would describe your own thoughts and emotions as...",
            element: CactusElement.emotions,
            gapType: GapType.satisfaction,
        }).addOption(1, "mysterious")
        .addOption(2)
        .addOption(3, "a work in progress", true)
        .addOption(4)
        .addOption(5, "well understood"),
        //1
        Question.create({
            title: "I do something to intentionally improve my mental and emotional fitness...",
            element: CactusElement.emotions,
            gapType: GapType.importance,
        })
        .addOption(1, "rarely, if ever")
        .addOption(2)
        .addOption(3, "once a week")
        .addOption(4)
        .addOption(5, "every day"),

        //2
        Question.create({
            title: "Think about the ways you care for your physical health and manage your mind-body connection. How satisfied are you with the effectiveness of those activities?",
            element: CactusElement.energy,
            gapType: GapType.satisfaction,
        })
        .addOption(1, "completely dissatisfied")
        .addOption(2)
        .addOption(3, "somewhat satisfied")
        .addOption(4)
        .addOption(5, "completely satisfied"),

        //3
        Question.create({
            title: "How important is your physical and mental energy?",
            element: CactusElement.energy,
            gapType: GapType.importance,
        })
        .addOption(1, "not at all important")
        .addOption(2)
        .addOption(3, "somewhat important")
        .addOption(4)
        .addOption(5, "extremely important"),

        //4
        Question.create({
            title: "Consider the ways in which you explore your own intellectual curiosities and learn new things.  How intellectually and emotionally satisfied are you in those areas of your life?",
            element: CactusElement.experience,
            gapType: GapType.satisfaction,
        })
        .addOption(1, "completely dissatisfied")
        .addOption(2)
        .addOption(3, "somewhat satisfied")
        .addOption(4)
        .addOption(5, "completely satisfied"),

        //5
        Question.create({
            title: "How important to you is feeding your intellectual curiosity and experience?",
            element: CactusElement.experience,
            gapType: GapType.importance,
        })
        .addOption(1, "not at all important")
        .addOption(2)
        .addOption(3, "somewhat important")
        .addOption(4)
        .addOption(5, "extremely important"),

        //6
        Question.create({
            title: "Think of the ways you develop rewarding and fulfilling relationships with yourself and others. Today, how satisfied are you with that area of your life?",
            element: CactusElement.relationships,
            gapType: GapType.satisfaction,
        })
        .addOption(1, "completely dissatisfied")
        .addOption(2)
        .addOption(3, "somewhat satisfied")
        .addOption(4)
        .addOption(5, "completely satisfied"),

        //7
        Question.create({
            title: "How important to you are the relationships with yourself and others?",
            element: CactusElement.relationships,
            gapType: GapType.importance,
        })
        .addOption(1, "not at all important")
        .addOption(2)
        .addOption(3, "somewhat important")
        .addOption(4)
        .addOption(5, "extremely important"),

        //8
        Question.create({
            title: "As you strive towards optimism, how satisfied are you with your ability to embrace the spectrum of emotions you go through each day?",
            element: CactusElement.emotions,
            gapType: GapType.satisfaction,
        })
        .addOption(1, "completely dissatisfied")
        .addOption(2)
        .addOption(3, "somewhat satisfied")
        .addOption(4)
        .addOption(5, "completely satisfied"),

        //9
        Question.create({
            title: "How important to you is having a positive relationship with your emotions?",
            element: CactusElement.emotions,
            gapType: GapType.importance,
        })
        .addOption(1, "not at all important")
        .addOption(2)
        .addOption(3, "somewhat important")
        .addOption(4)
        .addOption(5, "extremely important"),

        //10
        Question.create({
            title: "How satisfied are you with your ability to live with a sense of purpose while you focus on the present moment? ",
            element: CactusElement.meaning,
            gapType: GapType.satisfaction,
        })
        .addOption(1, "completely dissatisfied")
        .addOption(2)
        .addOption(3, "somewhat satisfied")
        .addOption(4)
        .addOption(5, "completely satisfied"),

        //11
        Question.create({
            title: "How important to you is living with a sense of purpose and meaning?",
            element: CactusElement.meaning,
            gapType: GapType.importance,
        })
        .addOption(1, "not at all important")
        .addOption(2)
        .addOption(3, "somewhat important")
        .addOption(4)
        .addOption(5, "extremely important"),

    ].map((q, index) => {
        q.id = `${ index }`
        return q;
    })
}
