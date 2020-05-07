import GapAnalysisAssessment from "@shared/models/GapAnalysisAssessment";
import { RadarChartData } from "@shared/charts/RadarChartData";
import { isNotNull } from "@shared/util/ObjectUtil";
import { GapType } from "@shared/models/GapAnalysisQuestion";
import { CactusElement } from "@shared/models/CactusElement";

export default class GapAnalysisAssessmentResult {
    errorMessage?: string;
    chartData?: RadarChartData[]

    static create(params: { assessment: GapAnalysisAssessment, responsesByQuestionId: Record<string, number | undefined> }): GapAnalysisAssessmentResult {
        const result = new GapAnalysisAssessmentResult();
        const { assessment, responsesByQuestionId } = params;

        const responseQuestionIds = Object.values(responsesByQuestionId).filter(isNotNull)

        //quick guard for mismatched questions & answers;
        if (assessment.questions.length !== responseQuestionIds.length) {
            result.errorMessage = "Not all questions were ansered. Unable to calculate a result";
            return result;
        }

        const gapMap: Record<GapType, RadarChartData> = {
            [GapType.importance]: { name: GapType.importance, axes: [] },
            [GapType.satisfaction]: { name: GapType.satisfaction, axes: [] },
        }

        assessment.questions.reduce((map, question) => {
            const type = question.gapType;

            const dataList = map[type].axes;
            const answerValue = responsesByQuestionId[question.id];
            dataList.push({
                axis: question.element,
                value: answerValue ?? 0
            })

            return map;
        }, gapMap)

        result.chartData = Object.values(gapMap);

        return result;
    }

    static mock() {
        const result = new GapAnalysisAssessmentResult();
        result.chartData = [{
            name: "Importance",
            axes:
            [
                { value: 1, axis: CactusElement.relationships },
                { value: 3, axis: CactusElement.experience },
                { value: 1, axis: CactusElement.emotions },
                { value: 5, axis: CactusElement.meaning },
                { value: 1, axis: CactusElement.energy },
            ]
        }, {
            name: "Satisfaction",
            axes: [
                { value: 1, axis: CactusElement.experience },
                { value: 1, axis: CactusElement.emotions },
                { value: 1, axis: CactusElement.meaning },
                { value: 1, axis: CactusElement.energy },
                { value: 4, axis: CactusElement.relationships },
            ]
        }]

        return result;

    }
}