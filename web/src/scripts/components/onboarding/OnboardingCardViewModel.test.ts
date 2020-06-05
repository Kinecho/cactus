import Model, { CardType, TextReplacementType } from "@components/onboarding/OnboardingCardViewModel"

describe("get replacer text", () => {
    test("insight word with a value", () => {
        const m = Model.create({
            type: CardType.reflect,
            text: "This is {{VALUE}} text",
            textReplacementType: TextReplacementType.selected_insight_word,
        })

        const processed = m.getMarkdownText({ selectedInsight: "Insight" });
        expect(processed).toEqual("This is Insight text");
    })

    test("Insight word, no value provided", () => {
        const m = Model.create({
            type: CardType.reflect,
            text: "This is {{VALUE}} text",
            textReplacementType: TextReplacementType.selected_insight_word,
        })

        const processed = m.getMarkdownText({ selectedInsight: undefined });
        expect(processed).toEqual("This is text"); //only a single space should remain
    })

    test("Insight word, no value provided, with default value", () => {
        const m = Model.create({
            type: CardType.reflect,
            text: "This is {{VALUE}} text",
            defaultReplacementValue: "DEFAULT",
            textReplacementType: TextReplacementType.selected_insight_word,
        })

        const processed = m.getMarkdownText({ selectedInsight: undefined });
        expect(processed).toEqual("This is DEFAULT text");
    })
})
