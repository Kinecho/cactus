export default class GapAnalysisQuestionOption {
    value!: number;
    label?: string;

    static create(value: number, label?: string): GapAnalysisQuestionOption {
        const option = new GapAnalysisQuestionOption();
        option.value = value;
        option.label = label;
        return option;
    }
}