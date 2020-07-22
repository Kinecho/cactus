import { SentenceTone, ToneScore } from "@shared/api/ToneAnalyzerTypes";
import { decodeHTMLEntities, isBlank } from "@shared/util/StringUtil";

export function createParagraphs(params: { text?: string|null, sentenceTones?: SentenceTone[], documentTones?: ToneScore[] }): SentenceTone[][] {
    const { text, sentenceTones = [], documentTones = [] } = params;
    const results: SentenceTone[][] = [];

    if (!text) {
        return results;
    }

    const decodedText = decodeHTMLEntities(text)!;
    const textParagraphs: string[] = decodedText.split("\n").filter(s => !isBlank(s));
    const remainingSentences = [...sentenceTones.filter(s => !isBlank(s.text))];

    if (textParagraphs.length === 1 && (sentenceTones ?? []).length === 0) {
        return [[{ sentenceId: 1, tones: documentTones, text: decodedText }]]
    }

    let sentence = remainingSentences.shift();
    let sentenceId = 1
    for (let textParagraph of textParagraphs) {
        const sentenceGroup: SentenceTone[] = [];

        if (!sentence) {
            sentenceGroup.push({ sentenceId, text: textParagraph });
            sentenceId++;
        } else {
            let paragraphContainsSentence = false;
            do {
                if (!sentence) {
                    if (!isBlank(textParagraph)) {
                        sentenceGroup.push({ sentenceId, text: textParagraph.trim() });
                        textParagraph = "";
                        sentenceId++;
                    }
                    continue;
                }
                const sText = sentence.text;
                if (!sText || isBlank(sText)) {
                    sentence = remainingSentences.shift();
                    continue;
                }
                //does the current paragraph contain the sentence?
                const sentenceIndex = textParagraph.indexOf(sText);
                paragraphContainsSentence = sentenceIndex >= 0;

                if (sentenceIndex > 0) {
                    const prefix = textParagraph.substring(0, sentenceIndex);
                    textParagraph = textParagraph.substring(sentenceIndex).trim();
                    sentenceGroup.push({ sentenceId, text: prefix.trim() })
                    sentenceId++;
                } else if (paragraphContainsSentence) {
                    sentenceGroup.push({ ...sentence, sentenceId })
                    textParagraph = textParagraph.substring(sentence.text.length).trim();
                    sentence = remainingSentences.shift();
                    sentenceId++;
                } else if (!isBlank(textParagraph)) {
                    sentenceGroup.push({ sentenceId, text: textParagraph.trim() });
                    textParagraph = "";
                    sentenceId++;
                }

            } while (paragraphContainsSentence && !isBlank(textParagraph))
        }
        results.push(sentenceGroup);
    }

    return results;
}