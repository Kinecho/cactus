import { v1beta2 } from "@google-cloud/language";
import { CactusConfig } from "@admin/CactusConfig";
import Logger from "@shared/Logger";
import { isBlank } from "@shared/util/StringUtil";
import { google } from "@google-cloud/language/build/protos/protos";
import Document = google.cloud.language.v1.Document;
import { InsightWord, InsightWordsResult, SentimentResult } from "@shared/api/InsightLanguageTypes";

const logger = new Logger("GoogleLanguageService");

export enum WordTypes {
    VERB = 'verb',
    NOUN = 'noun',
    ADJ = 'adjective'
}

export default class GoogleLanguageService {
    protected static sharedInstance: GoogleLanguageService;

    client: v1beta2.LanguageServiceClient;
    config: CactusConfig;
    tagsToKeep: string[]

    static getSharedInstance(): GoogleLanguageService {
        if (!GoogleLanguageService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize GoogleLanguageService before using it");
        }
        return GoogleLanguageService.sharedInstance;
    }

    static initialize(config: CactusConfig) {
        GoogleLanguageService.sharedInstance = new GoogleLanguageService(config);
    }

    constructor(config: CactusConfig) {
        const credentials = config.language.service_account;
        const authCredentials = {
            credentials: {
                client_email: credentials.client_email,
                private_key: credentials.private_key
            }
        };
        this.client = new v1beta2.LanguageServiceClient(authCredentials);
        this.config = config;
        this.tagsToKeep = ['NOUN', 'VERB', 'ADJ'];
    }

    async getEntities(text: string): Promise<any[] | undefined> {
        const document = {
            content: text,
            type: Document.Type.PLAIN_TEXT
        };
        try {
            const [entityResponse] = await this.client.analyzeEntities({ document: document });
            return entityResponse?.entities ?? undefined;
        } catch (error) {
            logger.log('There was an error analyzing entities with Google Language API', error);
            return;
        }
    }

    async getSyntaxTokens(text: string): Promise<any> {
        const document = {
            content: text,
            type: Document.Type.PLAIN_TEXT,
        };
        try {
            const [result] = await this.client.analyzeSyntax({ document: document });
            return result.tokens;
        } catch (error) {
            logger.log('There was an error analyzing syntax with Google Language API', error);
            return;
        }
    }

    /**
     * Get the sentiment of the text. Note, we return a Cactus interface here, so if the google API changes,
     * we'll have to map it to a Cactus object.
     * @param {string} text
     * @return {Promise<SentimentResult | undefined>}
     */
    async getSentiment(text?: string): Promise<SentimentResult | undefined> {
        try {
            const document = {
                content: text,
                type: Document.Type.PLAIN_TEXT,
            }
            const [sentiment] = await this.client.analyzeSentiment({ document })
            return sentiment;
        } catch (error) {
            logger.info("Failed to get document sentiment")
            logger.error(error);
            return undefined;
        }
    }

    async insightWords(text?: string): Promise<InsightWordsResult> {
        try {
            if (!text || isBlank(text)) {
                return {
                    insightWords: [],
                };
            }

            const [syntaxTokens, entities] = await Promise.all([
                this.getSyntaxTokens(text),
                this.getEntities(text)
            ]);

            const insightWords: InsightWord[] = [];

            syntaxTokens?.forEach((token: any) => {
                if (this.tagsToKeep.includes(token.partOfSpeech?.tag)) {
                    if (token.text?.content) {
                        const wordObj: InsightWord = {
                            word: token.text.content,
                            partOfSpeech: WordTypes[token.partOfSpeech.tag as keyof typeof WordTypes]
                        };

                        if (entities) {
                            const salience = this.getSalience(wordObj.word, entities);
                            if (salience) {
                                wordObj.salience = salience;
                            }
                        }

                        insightWords.push(wordObj);
                    }
                }
            });


            // sort words by salience
            if (insightWords.length > 1) {
                insightWords.sort((a, b) => ((a.salience || 0) > (b.salience || 0)) ? -1 : 1)
            }

            return {
                insightWords: insightWords,
                // syntaxRaw: syntaxTokens,
                // entitiesRaw: entities
            };
        } catch (error) {
            logger.error("Failed to get insight words", error);
            return {
                insightWords: [],
            };
        }
    }

    getSalience(word: string, entities: any[]): number | undefined {
        const found = entities.find((entity: any) => entity.name === word);
        return (found ? found.salience : undefined);
    }

}



