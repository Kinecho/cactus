import { createParagraphs } from "@shared/util/ToneAnalyzerUtil";
import { PattonToneResult, PattonSpeech } from "@shared/util/ToneAnalyzerFixtures";


describe("createParagraphs", () => {
    test("simple paragraph with all sentences present", () => {
        const sentenceTones = [
            {
                text: "Sentence one.",
                sentenceId: 1,
            }, {
                text: "Sentence two.",
                sentenceId: 2,
            }
        ]

        const text = "Sentence one. Sentence two.";
        const result = createParagraphs({ text, sentenceTones })

        expect(result.length).toEqual(1);
        expect(result).toEqual([sentenceTones]);
    })

    test("simple paragraph with text not found in analysis", () => {
        const sentenceTones = [
            {
                text: "Sentence one.",
                sentenceId: 1,
            }, {
                text: "Sentence two.",
                sentenceId: 2,
            }
        ]

        const text = "Sentence one. Not included. Sentence two.";

        const expected = [[
            {
                text: "Sentence one.",
                sentenceId: 1,
            }, {
                sentenceId: 2,
                text: "Not included."
            },
            {
                text: "Sentence two.",
                sentenceId: 3,
            }
        ]]

        const result = createParagraphs({ text, sentenceTones })

        expect(result.length).toEqual(1);
        expect(result).toEqual(expected);
    })

    test("several paragraphs with text not found in analysis", () => {
        const sentenceTones = [
            {
                text: "Sentence one.",
                sentenceId: 1,
            }, {
                text: "Sentence two.",
                sentenceId: 2,
            },
            {
                text: "B one.",
                sentenceId: 3,
            },
            {
                text: "B two.",
                sentenceId: 4,
            }
        ]

        const text = "Sentence one. Not included. Sentence two.\n\nB one. B two.\nSingle Spaced, not included.";

        const expected = [[
            {
                text: "Sentence one.",
                sentenceId: 1,
            }, {
                sentenceId: 2,
                text: "Not included."
            },
            {
                text: "Sentence two.",
                sentenceId: 3,
            }
        ], [{
            sentenceId: 4,
            text: "B one."
        },
            {
                text: "B two.",
                sentenceId: 5,
            }
        ], [{
            text: "Single Spaced, not included.",
            sentenceId: 6,
        }]]

        const result = createParagraphs({ text, sentenceTones })

        expect(result.length).toEqual(3);
        expect(result).toEqual(expected);
    })

    test("With long speech", () => {
        const result = createParagraphs({ text: PattonSpeech, sentenceTones: PattonToneResult.sentencesTones! })



        expect(result.length).toEqual(3);
        expect(result[0].length).toEqual(10);
        expect(result[1].length).toEqual(7);
        expect(result[2].length).toEqual(9);

    })

})