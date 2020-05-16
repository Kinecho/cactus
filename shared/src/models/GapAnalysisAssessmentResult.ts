import GapAnalysisAssessment from "@shared/models/GapAnalysisAssessment";
import { RadarChartData } from "@shared/charts/RadarChartData";
import { isNotNull } from "@shared/util/ObjectUtil";
import { GapType } from "@shared/models/GapAnalysisQuestion";
import { CactusElement } from "@shared/models/CactusElement";
import { BaseModel, Collection } from "@shared/FirestoreBaseModels";

export type ElementResultMap = { [key in CactusElement]: number };

function createElementResultMap(): ElementResultMap {
    return {
        [CactusElement.relationships]: 0,
        [CactusElement.experience]: 0,
        [CactusElement.emotions]: 0,
        [CactusElement.meaning]: 0,
        [CactusElement.energy]: 0,
    }
}

enum Fields {
    memberId = "memberId",
    completed = "completed",
    completedAt = "completedAt",
}

export default class GapAnalysisAssessmentResult extends BaseModel {
    static Fields = Fields;
    collection = Collection.gapAnalysisAssessmentResults
    errorMessage?: string;
    memberId?: string | undefined | null;
    completed: boolean = false;
    completedAt?: Date | undefined = undefined;
    importance?: ElementResultMap | null | undefined = null
    satisfaction?: ElementResultMap | null | undefined = null;

    responsesByQuestionId: Record<string, number | undefined> = {};

    setCompleted() {
        this.completed = true
        this.completedAt = new Date();
    }

    setAnswer(params: { questionId: string, value: number | undefined }) {
        //creating a new instance of the map, to support responsiveness in the Vue
        this.responsesByQuestionId = { ...this.responsesByQuestionId, [params.questionId]: params.value }
    }

    chartDataFromElementResultMap(map: ElementResultMap, name: string): RadarChartData {
        return {
            name,
            axes: (Object.keys(map) as CactusElement[]).map((element) => ({
                value: map[element],
                axis: element,
            }))
        }
    }

    get chartData(): RadarChartData[] {
        if (!this.importance && !this.satisfaction) {
            return [];
        }

        const results: RadarChartData[] = []

        const importance = this.importance;
        const satisfaction = this.satisfaction;
        if (importance) {
            results.push(this.chartDataFromElementResultMap(importance, "Importance"))
        }

        if (satisfaction) {
            results.push(this.chartDataFromElementResultMap(satisfaction, "Satisfaction"))
        }

        return results;
    }

    prepareForFirestore(): any {
        return super.prepareForFirestore();
    }

    prepareFromFirestore(data: any): any {
        return super.prepareFromFirestore(data);
    }

    static create(params?: { responsesByQuestionId?: Record<string, number | undefined> }): GapAnalysisAssessmentResult {
        const result = new GapAnalysisAssessmentResult();
        result.responsesByQuestionId = params?.responsesByQuestionId ?? {};
        return result;
    }

    calculateResults(params: { assessment: GapAnalysisAssessment, }): GapAnalysisAssessmentResult {
        const { assessment } = params;
        const result = this;
        const responseQuestionIds = Object.values(this.responsesByQuestionId).filter(isNotNull)

        //quick guard for mismatched questions & answers;
        if (assessment.questions.length !== responseQuestionIds.length) {
            result.errorMessage = "Not all questions were answered. Unable to calculate a result";
            return result;
        }

        const importance: ElementResultMap = createElementResultMap();
        const satisfaction: ElementResultMap = createElementResultMap();

        assessment.questions.forEach(question => {
            const type = question.gapType;
            const answerValue = this.responsesByQuestionId[question.id];
            if (type === GapType.importance) {
                importance[question.element] = answerValue ?? 0
            } else if (type === GapType.satisfaction) {
                satisfaction[question.element] = answerValue ?? 0;
            }
        })

        result.importance = importance;
        result.satisfaction = satisfaction;

        return result;
    }

    static mock() {
        const result = new GapAnalysisAssessmentResult();

        result.importance = {
            [CactusElement.relationships]: 1,
            [CactusElement.experience]: 3,
            [CactusElement.emotions]: 1,
            [CactusElement.meaning]: 5,
            [CactusElement.energy]: 1,
        }

        result.satisfaction = {
            [CactusElement.relationships]: 1,
            [CactusElement.experience]: 1,
            [CactusElement.emotions]: 1,
            [CactusElement.meaning]: 1,
            [CactusElement.energy]: 4,
        }

        return result;
    }

    static fromChartData(params: { chartData: RadarChartData[], error?: string }): GapAnalysisAssessmentResult {
        const result = new GapAnalysisAssessmentResult();


        return result;
    }
}