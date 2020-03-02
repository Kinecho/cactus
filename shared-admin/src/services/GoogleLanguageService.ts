import language from "@google-cloud/language";
import {CactusConfig} from "@shared/CactusConfig";

export default class GoogleLanguageService {
    protected static sharedInstance: GoogleLanguageService;

    client: any;
    config: CactusConfig;

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

}



