import { SentenceTone } from "@shared/api/ToneAnalyzerTypes";
import Logger from "@shared/Logger"
import { decodeHTMLEntities, isBlank } from "@shared/util/StringUtil";

const logger = new Logger("ToneAnalyzerUtil");


export function createParagraphs(params: { text: string, sentenceTones: SentenceTone[] }): SentenceTone[][] {
    const { text, sentenceTones } = params;
    const results: SentenceTone[][] = [];

    logger.info("sentence tones", sentenceTones);

    const decodedText = decodeHTMLEntities(text)!;
    logger.info("Decoded text", decodedText);
    const textParagraphs: string[] = decodedText.split("\n").filter(s => !isBlank(s));
    logger.info(`Found ${ textParagraphs.length } paragraphs in the original text. Processing them now`);
    logger.info(`There are ${ sentenceTones.length } sentences in the processed data`);
    const remainingSentences = [...sentenceTones.filter(s => !isBlank(s.text))];

    let sentence = remainingSentences.shift();
    let sentenceId = 1
    for (let i = 0; i < textParagraphs.length; i++) {
        let textParagraph = textParagraphs[i];
        const sentenceGroup: SentenceTone[] = [];

        logger.info(`Processing Text Paragraph ${ i }:`, textParagraph)
        if (!sentence) {
            logger.info("There was no sentence found, pushing paragraph and returning")
            sentenceGroup.push({ sentenceId, text: textParagraph });
            sentenceId++;
        } else {
            let paragraphContainsSentence = false;
            do {
                if (!sentence) {
                    logger.info("No sentence remains, pushing remaining paragraph");
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
                    logger.info("No sentence text, shifted sentence and continuing");
                    continue;
                }
                logger.info(`Paragraph ${ i } Processing sentence:`, sentence);
                //does the current paragraph contain the sentence?
                const sentenceIndex = textParagraph.indexOf(sText);
                paragraphContainsSentence = sentenceIndex >= 0;

                if (sentenceIndex > 0) {
                    const prefix = textParagraph.substring(0, sentenceIndex);
                    textParagraph = textParagraph.substring(sentenceIndex).trim();
                    logger.info(`adding non-accounted for sentenceId ${ sentenceId } to array`, prefix);
                    sentenceGroup.push({ sentenceId, text: prefix.trim() })
                    sentenceId++;
                } else if (paragraphContainsSentence) {
                    sentenceGroup.push({ ...sentence, sentenceId })
                    textParagraph = textParagraph.substring(sentence.text.length).trim();
                    logger.info(`Added sentence ${ sentenceId } to paragraph ${ i }`);
                    sentence = remainingSentences.shift();
                    sentenceId++;
                } else if (!isBlank(textParagraph)) {
                    sentenceGroup.push({ sentenceId, text: textParagraph.trim() });
                    textParagraph = "";
                    sentenceId++;
                }

            } while (paragraphContainsSentence && !isBlank(textParagraph))
        }
        logger.info("Pushing sentence group to the resutls array", sentenceGroup);
        results.push(sentenceGroup);
    }

    logger.info("The results of the groups are", results);
    return results;
}