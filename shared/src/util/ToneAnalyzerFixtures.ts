import { ToneID, ToneResult } from "@shared/api/ToneAnalyzerTypes";

export const PattonSpeech = "Men, all this stuff you hear about America not wanting to fight, wanting to stay out of the war, is a lot of bullshit. Americans love to fight. All real Americans love the sting and clash of battle. When you were kids, you all admired the champion marble shooter, the fastest runner, the big-league ball players and the toughest boxers. Americans love a winner and will not tolerate a loser. Americans play to win all the time. That's why Americans have never lost and will never lose a war. The very thought of losing is hateful to Americans. Battle is the most significant competition in which a man can indulge. It brings out all that is best and it removes all that is base.\n" +
"\n" +
"You are not all going to die. Only two percent of you right here today would be killed in a major battle. Every man is scared in his first action. If he says he's not, he's a goddamn liar. But the real hero is the man who fights even though he's scared. Some men will get over their fright in a minute under fire, some take an hour, and for some it takes days. But the real man never lets his fear of death overpower his honor, his sense of duty to his country, and his innate manhood.\n" +
"\n" +
"All through your army career you men have bitched about what you call 'this chicken-shit drilling.' That is all for a purpose—to ensure instant obedience to orders and to create constant alertness. This must be bred into every soldier. I don't give a fuck for a man who is not always on his toes. But the drilling has made veterans of all you men. You are ready! A man has to be alert all the time if he expects to keep on breathing. If not, some German son-of-a-bitch will sneak up behind him and beat him to death with a sock full of shit. There are four hundred neatly marked graves in Sicily, all because one man went to sleep on the job—but they are German graves, because we caught the bastard asleep before his officer did."

export const PattonToneResult: ToneResult = {
    documentTone: {
        "tones": [
            {
                "score": 0.68572,
                toneId: ToneID.fear,
                "toneName": "Fear"
            },
            {
                "score": 0.505019,
                toneId: ToneID.joy,
                "toneName": "Joy"
            },
            {
                "score": 0.59125,
                toneId: ToneID.anger,
                "toneName": "Anger"
            },
            {
                "score": 0.547951,
                toneId: ToneID.sadness,
                "toneName": "Sadness"
            },
            {
                "score": 0.862867,
                toneId: ToneID.confident,
                "toneName": "Confident"
            }
        ]
    },
    "sentencesTones": [
        {
            "sentenceId": 0,
            "text": "Men, all this stuff you hear about America not wanting to fight, wanting to stay out of the war, is a lot of bullshit.",
            "tones": [
                {
                    "score": 0.74579,
                    toneId: ToneID.anger,
                    "toneName": "Anger"
                }
            ]
        },
        {
            "sentenceId": 1,
            "text": "Americans love to fight.",
            "tones": [
                {
                    "score": 0.700435,
                    toneId: ToneID.joy,
                    "toneName": "Joy"
                }
            ]
        },
        {
            "sentenceId": 2,
            "text": "All real Americans love the sting and clash of battle.",
            "tones": [
                {
                    "score": 0.530043,
                    toneId: ToneID.sadness,
                    "toneName": "Sadness"
                },
                {
                    "score": 0.91513,
                    toneId: ToneID.confident,
                    "toneName": "Confident"
                }
            ]
        },
        {
            "sentenceId": 3,
            "text": "When you were kids, you all admired the champion marble shooter, the fastest runner, the big-league ball players and the toughest boxers.",
            "tones": [
                {
                    "score": 0.579436,
                    toneId: ToneID.confident,
                    "toneName": "Confident"
                }
            ]
        },
        {
            "sentenceId": 4,
            "text": "Americans love a winner and will not tolerate a loser.",
            "tones": []
        },
        {
            "sentenceId": 5,
            "text": "Americans play to win all the time.",
            "tones": [
                {
                    "score": 0.575489,
                    toneId: ToneID.joy,
                    "toneName": "Joy"
                },
                {
                    "score": 0.92125,
                    toneId: ToneID.confident,
                    "toneName": "Confident"
                }
            ]
        },
        {
            "sentenceId": 6,
            "text": "That's why Americans have never lost and will never lose a war.",
            "tones": [
                {
                    "score": 0.80026,
                    toneId: ToneID.confident,
                    "toneName": "Confident"
                }
            ]
        },
        {
            "sentenceId": 7,
            "text": "The very thought of losing is hateful to Americans.",
            "tones": [
                {
                    "score": 0.652479,
                    toneId: ToneID.sadness,
                    "toneName": "Sadness"
                },
                {
                    "score": 0.660207,
                    toneId: ToneID.confident,
                    "toneName": "Confident"
                },
                {
                    "score": 0.724236,
                    toneId: ToneID.analytical,
                    "toneName": "Analytical"
                }
            ]
        },
        {
            "sentenceId": 8,
            "text": "Battle is the most significant competition in which a man can indulge.",
            "tones": []
        },
        {
            "sentenceId": 9,
            "text": "It brings out all that is best and it removes all that is base.",
            "tones": [
                {
                    "score": 0.92125,
                    toneId: ToneID.confident,
                    "toneName": "Confident"
                }
            ]
        },
        {
            "sentenceId": 10,
            "text": "You are not all going to die.",
            "tones": [
                {
                    "score": 0.835108,
                    toneId: ToneID.sadness,
                    "toneName": "Sadness"
                },
                {
                    "score": 0.806517,
                    toneId: ToneID.tentative,
                    "toneName": "Tentative"
                }
            ]
        },
        {
            "sentenceId": 11,
            "text": "Only two percent of you right here today would be killed in a major battle.",
            "tones": [
                {
                    "score": 0.594384,
                    toneId: ToneID.sadness,
                    "toneName": "Sadness"
                }
            ]
        },
        {
            "sentenceId": 12,
            "text": "Every man is scared in his first action.",
            "tones": [
                {
                    "score": 0.898273,
                    toneId: ToneID.fear,
                    "toneName": "Fear"
                },
                {
                    "score": 0.898327,
                    toneId: ToneID.confident,
                    "toneName": "Confident"
                }
            ]
        },
        {
            "sentenceId": 13,
            "text": "If he says he's not, he's a goddamn liar.",
            "tones": [
                {
                    "score": 0.854735,
                    toneId: ToneID.anger,
                    "toneName": "Anger"
                }
            ]
        },
        {
            "sentenceId": 14,
            "text": "But the real hero is the man who fights even though he's scared.",
            "tones": [
                {
                    "score": 0.929486,
                    toneId: ToneID.fear,
                    "toneName": "Fear"
                },
                {
                    "score": 0.543112,
                    toneId: ToneID.confident,
                    "toneName": "Confident"
                },
                {
                    "score": 0.762356,
                    toneId: ToneID.analytical,
                    "toneName": "Analytical"
                }
            ]
        },
        {
            "sentenceId": 15,
            "text": "Some men will get over their fright in a minute under fire, some take an hour, and for some it takes days.",
            "tones": [
                {
                    "score": 0.909883,
                    toneId: ToneID.tentative,
                    "toneName": "Tentative"
                }
            ]
        },
        {
            "sentenceId": 16,
            "text": "But the real man never lets his fear of death overpower his honor, his sense of duty to his country, and his innate manhood.",
            "tones": [
                {
                    "score": 0.923637,
                    toneId: ToneID.fear,
                    "toneName": "Fear"
                },
                {
                    "score": 0.543112,
                    toneId: ToneID.confident,
                    "toneName": "Confident"
                }
            ]
        },
        {
            "sentenceId": 17,
            "text": "All through your army career you men have bitched about what you call 'this chicken-shit drilling.'",
            "tones": [
                {
                    "score": 0.681336,
                    toneId: ToneID.anger,
                    "toneName": "Anger"
                }
            ]
        },
        {
            "sentenceId": 18,
            "text": "That is all for a purpose—to ensure instant obedience to orders and to create constant alertness.",
            "tones": [
                {
                    "score": 0.816764,
                    toneId: ToneID.confident,
                    "toneName": "Confident"
                },
                {
                    "score": 0.809841,
                    toneId: ToneID.analytical,
                    "toneName": "Analytical"
                }
            ]
        },
        {
            "sentenceId": 19,
            "text": "This must be bred into every soldier.",
            "tones": [
                {
                    "score": 0.967339,
                    toneId: ToneID.confident,
                    "toneName": "Confident"
                }
            ]
        },
        {
            "sentenceId": 20,
            "text": "I don't give a fuck for a man who is not always on his toes.",
            "tones": [
                {
                    "score": 0.607989,
                    toneId: ToneID.anger,
                    "toneName": "Anger"
                }
            ]
        },
        {
            "sentenceId": 21,
            "text": "But the drilling has made veterans of all you men.",
            "tones": [
                {
                    "score": 0.849827,
                    toneId: ToneID.confident,
                    "toneName": "Confident"
                }
            ]
        },
        {
            "sentenceId": 22,
            "text": "You are ready!",
            "tones": []
        },
        {
            "sentenceId": 23,
            "text": "A man has to be alert all the time if he expects to keep on breathing.",
            "tones": [
                {
                    "score": 0.884734,
                    toneId: ToneID.confident,
                    "toneName": "Confident"
                },
                {
                    "score": 0.781949,
                    toneId: ToneID.analytical,
                    "toneName": "Analytical"
                }
            ]
        },
        {
            "sentenceId": 24,
            "text": "If not, some German son-of-a-bitch will sneak up behind him and beat him to death with a sock full of shit.",
            "tones": [
                {
                    "score": 0.771047,
                    toneId: ToneID.anger,
                    "toneName": "Anger"
                }
            ]
        },
        {
            "sentenceId": 25,
            "text": "There are four hundred neatly marked graves in Sicily, all because one man went to sleep on the job—but they are German graves, because we caught the bastard asleep before his officer did.",
            "tones": []
        }
    ]
}