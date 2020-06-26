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

export interface SentimentText {
    content?: string | null,
    beginOffset?: number | null,
}

export interface SentimentSentence {
    text?: SentimentText | null,
    sentiment?: SentimentScore | null,
}

export interface SentimentScore {
    magnitude?: number | null,
    score?: number | null,
}

export interface SentimentResult {
    sentences?: SentimentSentence[] | null,
    documentSentiment?: SentimentScore | null,
    language?: string | null,
}