import GapAnalysisAssessment from "@shared/models/GapAnalysisAssessment";
import { RadarChartData } from "@shared/charts/RadarChartData";
import { isNotNull } from "@shared/util/ObjectUtil";
import { GapType } from "@shared/models/GapAnalysisQuestion";

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
}