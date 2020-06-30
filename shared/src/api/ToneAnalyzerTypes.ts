/*
Types for ToneAnalyzer
 */


export enum ToneID {
    anger = "anger",
    fear = "fear",
    joy = "joy",
    sadness = "sadness",
    analytical = "analytical",
    confident = "confident",
    tentative = "tentative",
    unknown = "unknown",
}

export interface ToneScore {
    /** how closely the tone matches the given text, from 0 to 1 */
    score: number,
    /** The ID for the tone */
    toneId: ToneID,
    /** Display Name for the tone, in english */
    toneName: string,
}

export interface SentenceTone {
    sentenceId: number,
    text: string,
    tones?: ToneScore[]
}

export interface DocumentToneResult {
    tones?: ToneScore[],
}

export interface ToneResult {
    documentTone?: DocumentToneResult;
    sentencesTones?: SentenceTone[];
}
