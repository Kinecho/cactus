import { LocalizedCopy } from "@shared/copy/CopyTypes";
import EnglishCopy from "@shared/copy/en-US";
import Logger from "@shared/Logger";

const logger = new Logger("CopyService");

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
                logger.error(`Unsupported locale ${ this.locale }, using ${ LocaleCode.en_US } as default`);
                this.copy = new EnglishCopy();
        }
    }

    getTrialDaysLeftShort(days: number, useEndsToday: boolean = false): string {
        if (days === 0 && useEndsToday) {
            return this.copy.common.ENDS_TODAY;
        } else if (days === 0 && !useEndsToday) {
            return `${ days } ${ this.copy.common.DAYS_LEFT }`
        } else if (days === 1) {
            return `${ days } ${ this.copy.common.DAY_LEFT }`
        } else {
            return `${ days } ${ this.copy.common.DAYS_LEFT }`;
        }
    }

    getTrialDaysLeftLong(days: number, useEndsToday: boolean = false): string {
        if (days === 1) {
            return useEndsToday ? this.copy.common.TRIAL_ENDS_TODAY : `${ days } ${ this.copy.common.DAY_LEFT_IN_TRIAL }`;
        } else {
            return `${ days } ${ this.copy.common.DAYS_LEFT_IN_TRIAL }`;
        }
    }
}



