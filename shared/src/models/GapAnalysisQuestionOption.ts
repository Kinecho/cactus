export default class GapAnalysisQuestionOption {
    value!: number;
    label?: string;
    icon?: string;
    selected?: boolean;

    static create(value: number, label?: string, icon?: string, selected?: boolean): GapAnalysisQuestionOption {
        const option = new GapAnalysisQuestionOption();
        option.value = value;
        option.label = label;
        option.icon = icon;
        option.selected = selected;
        return option;
    }
}
