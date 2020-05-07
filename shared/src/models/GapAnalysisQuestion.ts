import Option from "@shared/models/GapAnalysisQuestionOption";
import { CactusElement } from "@shared/models/CactusElement";
import { SvgIconName } from "@shared/types/IconTypes";

export enum GapType {
    importance = "importance",
    satisfaction = "satisfaction",
}

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
     * The type of gap in the analysis this question represents
     */
    gapType!: GapType;

    /**
     * The options to present to the user.
     * @type {any[]}
     */
    options: Option[] = [];

    static create(params: { options?: Option[], title: string, element: CactusElement, gapType: GapType }): GapAnalysisQuestion {
        const question = new GapAnalysisQuestion();
        const { options, title, element, gapType } = params;
        question.options = options ?? [];
        question.title = title;
        question.element = element;
        question.gapType = gapType;
        return question;
    }

    /**
     * Add an option. Uses the builder pattern.
     * @param {number} value
     * @param {string} label
     * @param {string} icon
     * @param {boolean} selected
     * @return {GapAnalysisQuestion} Returns self
     */
    addOption(value: number, label?: string, icon?: SvgIconName, selected?: boolean): GapAnalysisQuestion {
        this.options.push(Option.create(value, label, icon, selected));
        return this;
    }
}
