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