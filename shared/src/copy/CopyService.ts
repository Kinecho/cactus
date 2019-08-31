import {LocalizedCopy} from "@shared/copy/CopyTypes";
import EnglishCopy from "@shared/copy/en-US";

export enum LocaleCode {
    en_US = "en-US",
    es = "es",
}

export default class CopyService {

    protected static sharedInstance: CopyService = new CopyService();

    static getSharedInstance(): CopyService {
        if (!CopyService.sharedInstance) {
            throw new Error("No shared CopyService instance is available. Ensure you have called the initialize() function before using the shared instance")
        }
        return CopyService.sharedInstance;
    }

    static initialize(config: { locale?: LocaleCode } = {}) {
        console.log("Initializing firestore service");
        CopyService.sharedInstance = new CopyService(config);
    }

    locale: LocaleCode;
    copy: LocalizedCopy;

    constructor(config: { locale?: LocaleCode } = {}) {
        this.locale = config.locale || LocaleCode.en_US;

        switch (this.locale) {
            case LocaleCode.en_US:
                this.copy = new EnglishCopy();
                break;
            default:
                console.error(`Unsupported locale ${this.locale}, using ${LocaleCode.en_US} as default`);
                this.copy = new EnglishCopy();
        }
    }

}



