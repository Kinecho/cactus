import CoreValuesAssessment from "@shared/models/CoreValuesAssessment";

describe("Create default questions", () => {
    test("10 questions when no responses provided", () => {
        const assessment = CoreValuesAssessment.default();
        const questions = assessment.getQuestions(null)
        expect(questions).toHaveLength(10);
    })
})