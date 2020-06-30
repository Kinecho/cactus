import { createParagraphs } from "@shared/util/ToneAnalyzerUtil";
import {
    ONBOARDING_DEFAULT_TEXT,
    ONBOARDING_TONE_RESULTS,
    PattonSpeech,
    PattonToneResult
} from "@shared/util/ToneAnalyzerFixtures";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import Logger from "@shared/Logger"
import { ToneID } from "@shared/api/ToneAnalyzerTypes";

const logger = new Logger("ToneAnalyzerUtil.test");

describe("createParagraphs", () => {
    test("simple paragraph with all no results", () => {

        const text = "Sentence one. Sentence two.";
        const result = createParagraphs({ text, sentenceTones: [] })

        expect(result.length).toEqual(1);
        expect(result).toEqual([[{
            sentenceId: 1,
            text: "Sentence one. Sentence two.",
            tones: []
        }]]);
    })

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
        const result = createParagraphs({
            text: "First Text.\n\n" + PattonSpeech,
            sentenceTones: PattonToneResult.sentencesTones!
        })

        expect(result.length).toEqual(4);
        expect(result[0].length).toEqual(1);
        expect(result[1].length).toEqual(10);
        expect(result[2].length).toEqual(7);
        expect(result[3].length).toEqual(9);

    })

    test("with a colon ending a sentence/paragraph", () => {
        const sentenceTones = [
            {
                text: "Sentence one.",
                sentenceId: 1,
            }, {
                text: "Sentence two.",
                sentenceId: 2,
            }
        ]

        const text = "Sentence one.\n\nNot included:\n\nSentence two.";

        const expected = [[
            {
                text: "Sentence one.",
                sentenceId: 1,
            }], [{
            sentenceId: 2,
            text: "Not included:"
        }],
            [{
                text: "Sentence two.",
                sentenceId: 3,
            }
            ]]

        const result = createParagraphs({ text, sentenceTones })

        expect(result.length).toEqual(3);
        expect(result).toEqual(expected);
    })

    test("Onboarding tones", () => {
        const text = ONBOARDING_DEFAULT_TEXT;
        const result = createParagraphs({ text, sentenceTones: ONBOARDING_TONE_RESULTS.sentencesTones! });

        logger.info(stringifyJSON(result, 2));

        expect(result).toEqual([[
            {
                sentenceId: 1,
                text: "We use a service called the Tone Analyzer.",
                tones: [
                    {
                        score: 0.94715,
                        toneId: "analytical",
                        toneName: "Analytical"
                    }
                ]
            },
            {
                sentenceId: 2,
                text: "It gives you a positivity rating on your written notes.",
                tones: [
                    {
                        score: 0.830814,
                        toneId: "joy",
                        toneName: "Joy"
                    },
                    {
                        score: 0.849827,
                        toneId: "confident",
                        toneName: "Confident"
                    },
                    {
                        score: 0.687768,
                        toneId: "analytical",
                        toneName: "Analytical"
                    }
                ]
            },
            {
                sentenceId: 3,
                text: "You can also see which tones are sensed in your writing.",
                tones: []
            }, {
                sentenceId: 4,
                text: "These include Joy, Anger, Confident, and more.",
                tones: [
                    {
                        "score": 0.830814,
                        "toneId": "joy",
                        "toneName": "Joy"
                    },
                    {
                        "score": 0.849827,
                        "toneId": "confident",
                        "toneName": "Confident"
                    }
                ]
            }],
            [
                {
                    sentenceId: 5,
                    text: "Your notes remain private, secure, and forever yours.",
                    tones: [
                        {
                            "score": 0.97759,
                            "toneId": "confident",
                            "toneName": "Confident"
                        }
                    ]
                }
            ]]);

        expect(result.length).toEqual(2);

    })

    test("Abbreviated Onboarding tones", () => {
        const text = `Here's an example:

I wasn’t sure if I was able to get everything done. I felt great after enjoying a warm cup of coffee on the front porch.`;
        const sentenceTones = [{
            "sentenceId": 3,
            "text": "Here's an example:",
            "tones": [
                {
                    "score": 0.991736,
                    "toneId": ToneID.analytical,
                    "toneName": "Analytical"
                }
            ]
        },
            {
                "sentenceId": 4,
                "text": "",
                "tones": []
            },
            {
                "sentenceId": 5,
                "text": "I wasn’t sure if I was able to get everything done.",
                "tones": [
                    {
                        "score": 0.653099,
                        "toneId": ToneID.analytical,
                        "toneName": "Analytical"
                    },
                    {
                        "score": 0.602068,
                        "toneId": ToneID.tentative,
                        "toneName": "Tentative"
                    }
                ]
            },
            {
                "sentenceId": 6,
                "text": "I felt great after enjoying a warm cup of coffee on the front porch.",
                "tones": [
                    {
                        "score": 0.938492,
                        "toneId": ToneID.joy,
                        "toneName": "Joy"
                    }
                ]
            }]
        const result = createParagraphs({ text, sentenceTones });

        logger.info(stringifyJSON(result, 2));

        expect(result).toEqual([
            [
                {
                    sentenceId: 1,
                    text: "Here's an example:",
                    tones: [
                        {
                            score: 0.991736,
                            toneId: "analytical",
                            toneName: "Analytical"
                        }
                    ]
                }
            ],
            [{
                sentenceId: 2,
                text: "I wasn’t sure if I was able to get everything done.",
                tones: [
                    {
                        "score": 0.653099,
                        "toneId": "analytical",
                        "toneName": "Analytical"
                    },
                    {
                        "score": 0.602068,
                        "toneId": "tentative",
                        "toneName": "Tentative"
                    }
                ],
            }, {
                sentenceId: 3,
                text: "I felt great after enjoying a warm cup of coffee on the front porch.",
                tones: [
                    {
                        "score": 0.938492,
                        "toneId": "joy",
                        "toneName": "Joy"
                    }
                ]
            }],
        ]);

        expect(result.length).toEqual(2);
    })

})
