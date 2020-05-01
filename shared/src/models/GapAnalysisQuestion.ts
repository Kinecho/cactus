import Option from "@shared/models/GapAnalysisQuestionOption";
import { CactusElement } from "@shared/models/CactusElement";

export default class GapAnalysisQuestion {
    id!: string;

    /**
     * The main question to display to a user.
     */
    title!: string;

    /**
     * The Cactus element this question relates to
     */
    element!: CactusElement;

    /**
     * The options to present to the user.
     * @type {any[]}
     */
    options: Option[] = [];

    static create(params: { options?: Option[], title: string, element: CactusElement }): GapAnalysisQuestion {
        const question = new GapAnalysisQuestion();
        const { options, title, element } = params;
        question.options = options ?? [];
        question.title = title;
        question.element = element;
        return question;
    }

    /**
     * Add an option. Uses the builder pattern.
     * @param {number} value
     * @param {string} label
     * @return {GapAnalysisQuestion} Returns self
     */
    addOption(value: number, label?: string): GapAnalysisQuestion {
        this.options.push(Option.create(value, label));
        return this;
    }
}