import language from "@google-cloud/language";
import {CactusConfig} from "@shared/CactusConfig";

export enum WordTypes {
    VERB = 'verb',
    NOUN = 'noun',
    ADJ = 'adjective'
}

export interface InsightWord {
    word: string,
    partOfSpeech: string
    salience?: number
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

    async getEntities(text: string): Promise<any> {
        const document = {
            content: text,
            type: 'PLAIN_TEXT'
        };
        const entityResponse = await this.client.analyzeEntities({document: document});
        return entityResponse;
    }

    async getSyntaxTokens(text: string): Promise<any> {
        const document = {
            content: text,
            type: 'PLAIN_TEXT'
        };
        const [result] = await this.client.analyzeSyntax({document: document});
        return result.tokens;
    }

    async insightWords(text: string): Promise<InsightWord[]> {
        const tokens = await this.getSyntaxTokens(text);
        const entities = await this.getEntities(text);

        let insightWords: InsightWord[] = [];

        if (tokens) {
            tokens.forEach((token: any) => {
                if (this.tagsToKeep.includes(token.partOfSpeech?.tag)) {
                    if (token.text?.content) {
                        let wordObj: InsightWord = {
                            word: token.text.content,
                            partOfSpeech: WordTypes[token.partOfSpeech.tag as keyof typeof WordTypes]
                        };

                        let salience = this.getSalience(wordObj.word, entities);
                        if (salience) {
                            wordObj.salience = salience; 
                        }

                        insightWords.push(wordObj);
                    }
                }
            });
        }
        return insightWords;
    }

    getSalience(word: string, entities: []): number | undefined {
        const found: any = entities.find(function(entity: any) {
            console.log(entity.name);
            return entity.name === word
        });
        return (found ? found.salience : undefined);
    }

}



