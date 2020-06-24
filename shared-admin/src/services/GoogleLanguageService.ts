import language from "@google-cloud/language";
import {CactusConfig} from "@admin/CactusConfig";
import {InsightWord, InsightWordsResult} from "@shared/models/ReflectionResponse";
import Logger from "@shared/Logger";

const logger = new Logger("GoogleLanguageService");

export enum WordTypes {
    VERB = 'verb',
    NOUN = 'noun',
    ADJ = 'adjective'
}

export default class GoogleLanguageService {
    protected static sharedInstance: GoogleLanguageService;

    client: any;
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
        this.client = new language.LanguageServiceClient(authCredentials);
        this.config = config;
        this.tagsToKeep = ['NOUN','VERB','ADJ'];
    }

    async getEntities(text: string): Promise<any[] | undefined> {
        const document = {
            content: text,
            type: 'PLAIN_TEXT'
        };
        try {
            const entityResponse = await this.client.analyzeEntities({document: document});
            return entityResponse[0]?.entities;
        } catch(error) {
            logger.log('There was an error analyzing entities with Google Language API', error);
            return;
        }
    }

    async getSyntaxTokens(text: string): Promise<any> {
        const document = {
            content: text,
            type: 'PLAIN_TEXT'
        };
        try {
            const [result] = await this.client.analyzeSyntax({document: document});
            return result.tokens;
        } catch(error) {
            logger.log('There was an error analyzing syntax with Google Language API', error);
            return;
        }
    }

    async insightWords(text: string): Promise<InsightWordsResult> {
        const syntaxTokens = await this.getSyntaxTokens(text);
        const entities = await this.getEntities(text);

        const insightWords: InsightWord[] = [];

        if (syntaxTokens) {
            syntaxTokens.forEach((token: any) => {
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
        }

        // sort words by salience
        if (insightWords.length > 1) {
            insightWords.sort((a, b) => ((a.salience || 0) > (b.salience || 0)) ? -1 : 1)
        }

        return {
            insightWords: insightWords, 
            syntaxRaw: syntaxTokens, 
            entitiesRaw: entities
        };
    }

    getSalience(word: string, entities: any[]): number | undefined {
        const found = entities.find((entity: any) => entity.name === word);
        return (found ? found.salience : undefined);
    }

}



