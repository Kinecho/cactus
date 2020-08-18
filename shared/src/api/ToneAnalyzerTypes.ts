/*
Types for ToneAnalyzer
 */


import { Colors } from "@shared/util/ColorUtil";

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

export const ToneColorMap: { [tone in ToneID]: string } = {
    [ToneID.anger]: Colors.lightRoyal,
    [ToneID.fear]: Colors.mediumDolphin,
    [ToneID.joy]: Colors.lightDolphin,
    [ToneID.sadness]: Colors.royal,
    [ToneID.analytical]: Colors.pink,
    [ToneID.confident]: Colors.lightPink,
    [ToneID.tentative]: Colors.dolphin,
    [ToneID.unknown]: Colors.bgDolphin,
}

export function getToneDisplayName(tone: ToneID): string {
    switch (tone) {
        case ToneID.anger:
            return "Anger";
        case ToneID.fear:
            return "Fear";
        case ToneID.joy:
            return "Joy";
        case ToneID.sadness:
            return "Sadness";
        case ToneID.analytical:
            return "Analytical";
        case ToneID.confident:
            return "Confident";
        case ToneID.tentative:
            return "Tentative";
        case ToneID.unknown:
            return "Unknown";
    }
}