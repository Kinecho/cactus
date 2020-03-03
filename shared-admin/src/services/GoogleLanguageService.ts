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
        console.log("got response!", entityResponse);

        return entityResponse;
    }

    async getSyntaxTokens(text: string): Promise<any> {
        const document = {
            content: text,
            type: 'PLAIN_TEXT'
        };
        const [result] = await this.client.analyzeSyntax({document: document});
        console.log("got response!", result.tokens);

        return result.tokens;
    }

    async insightWords(text: string): Promise<InsightWord[]> {
        const tokens = await this.getSyntaxTokens(text);
        let insightWords: InsightWord[] = [];

        if (tokens) {
            tokens.forEach((token: any) => {
                if (this.tagsToKeep.includes(token.partOfSpeech?.tag)) {
                    if (token.text?.content) {
                        insightWords.push({
                            word: token.text.content,
                            partOfSpeech: WordTypes[token.partOfSpeech.tag as keyof typeof WordTypes]
                        });
                    }
                }
            });
        }
        return insightWords;
    }

}



