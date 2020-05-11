import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
import GapAnalysisAssessment from "@shared/models/GapAnalysisAssessment";
import GapAnalysisQuestion, { GapType } from "@shared/models/GapAnalysisQuestion";
import { CactusElement } from "@shared/models/CactusElement";

function createAssessment(args: [CactusElement, GapType][]): GapAnalysisAssessment {
    const assessment = new GapAnalysisAssessment();

    args.forEach((arg, index) => {
        const [element, gapType] = arg;
        assessment.addQuestion(GapAnalysisQuestion.create({ title: `Option ${ index }`, element, gapType }));
    })
    return assessment
}


test("ensure an error is returned when ids dont' match", () => {
    const assessment = createAssessment([
        [CactusElement.emotions, GapType.satisfaction],
        [CactusElement.emotions, GapType.importance]
    ])
    const answers = { "0": 2 };

    const result = GapAnalysisAssessmentResult.create({ assessment, responsesByQuestionId: answers });
    expect(result.errorMessage).toBeDefined();

})


test("get results when all questions are answered", () => {
    const assessment = createAssessment([
        [CactusElement.emotions, GapType.satisfaction],
        [CactusElement.emotions, GapType.importance]
    ])
    const answers = { "0": 2, "1": 5 };

    const result = GapAnalysisAssessmentResult.create({ assessment, responsesByQuestionId: answers });
    expect(result.errorMessage).toBeUndefined();

    expect(result.chartData?.length).toEqual(2);
    expect(result.chartData[0].axes.length).toEqual(1);
    expect(result.chartData[0].name).toEqual(GapType.importance);
    expect(result.chartData[0].axes[0].value).toEqual(5)


    expect(result.chartData[1].axes.length).toEqual(1);
    expect(result.chartData[1].name).toEqual(GapType.satisfaction);
    expect(result.chartData[1].axes[0].value).toEqual(2)

})