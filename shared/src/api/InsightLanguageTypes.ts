export interface InsightWord {
    word: string,
    partOfSpeech?: string
    salience?: number
    frequency?: number
}

/**
 * Not using syntaxRaw or entitiesRaw for now, although the data is available. The payloads are large.
 */
export interface InsightWordsResult {
    insightWords: InsightWord[],
    // syntaxRaw?: any,
    // entitiesRaw?: any
}

/**
 * Represents an output piece of text.
 */
export interface SentimentText {
    /**
     * The content of the output text.
     */
    content?: string | null,
    /**
     * The API calculates the beginning offset of the content in the original document according to the EncodingType specified in the API request.
     */
    beginOffset?: number | null,
}

/**
 * Represents a sentence in the input document.
 */
export interface SentimentSentence {
    /**
     * The sentence text
     */
    text?: SentimentText | null,
    sentiment?: SentimentScore | null,
}

/**
 * Represents the feeling associated with the entire text or entities in the text.
 */
export interface SentimentScore {
    /**
     * A non-negative number in the [0, +inf) range, which represents the absolute magnitude of sentiment regardless of score (positive or negative).
     */
    magnitude?: number | null,
    /**
     * Sentiment score between -1.0 (negative sentiment) and 1.0 (positive sentiment).
     */
    score?: number | null,
}

/**
 * The sentiment analysis response message.
 */
export interface SentimentResult {
    /**
     * The sentiment for all the sentences in the document.
     */
    sentences?: SentimentSentence[] | null,

    /**
     * The overall sentiment of the input document.
     */
    documentSentiment?: SentimentScore | null,

    /**
     * The language of the text, which will be the same as the language specified in the request or, if not specified, the automatically-detected language. See Document.language field for more details.
     */
    language?: string | null,
}