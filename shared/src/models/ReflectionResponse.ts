import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import {CactusElement} from "@shared/models/CactusElement";

export enum ResponseMedium {
    EMAIL = "EMAIL",
    PROMPT_WEB = "PROMPT_WEB",
    PROMPT_IOS = "PROMPT_IOS",
    PROMPT_ANDROID = "PROMPT_ANDROID",
    JOURNAL_WEB = "JOURNAL_WEB",
    JOURNAL_IOS = "JOURNAL_IOS",
    JOURNAL_ANDROID = "JOURNAL_ANDROID"
}

export function isJournal(medium?: ResponseMedium): boolean {
    return medium && [ResponseMedium.JOURNAL_ANDROID, ResponseMedium.JOURNAL_IOS, ResponseMedium.JOURNAL_WEB].includes(medium) || false;
}

export function getResponseMediumDisplayName(medium?: ResponseMedium | string): string {
    if (!medium) {
        return "Unknown";
    }
    let displayName: string;
    switch (medium) {
        case ResponseMedium.EMAIL:
            displayName = "Email";
            break;
        case ResponseMedium.JOURNAL_WEB:
            displayName = "Journal Web";
            break;
        case ResponseMedium.JOURNAL_IOS:
            displayName = "Journal iOS";
            break;
        case ResponseMedium.JOURNAL_ANDROID:
            displayName = "Journal Android";
            break;
        case ResponseMedium.PROMPT_WEB:
            displayName = "Prompt Web";
            break;
        case ResponseMedium.PROMPT_IOS:
            displayName = "Prompt iOS";
            break;
        case ResponseMedium.PROMPT_ANDROID:
            displayName = "Prompt Android";
            break;
        default:
            displayName = "Unknown";
            break;
    }
    return displayName;
}


export function getResponseMediumSlackEmoji(medium?: ResponseMedium): string {
    if (!medium) {
        return "Unknown";
    }
    let displayName: string;
    switch (medium) {
        case ResponseMedium.EMAIL:
            displayName = ":email:";
            break;
        case ResponseMedium.JOURNAL_WEB:
        case ResponseMedium.PROMPT_WEB:
            displayName = ":computer:";
            break;
        case ResponseMedium.JOURNAL_IOS:
        case ResponseMedium.PROMPT_IOS:
            displayName = ":ios:";
            break;
        case ResponseMedium.JOURNAL_ANDROID:
        case ResponseMedium.PROMPT_ANDROID:
            displayName = ":android:";
            break;
        default:
            displayName = `Unknown (${medium})`;
            break;
    }
    return displayName;
}


export interface ReflectionContent {
    text?: string;
}

export enum ReflectionResponseField {
    responseDate = "responseDate",
    userId = "userId",
    cactusMemberId = "cactusMemberId",
    emailReplyId = "emailReplyId",
    responseMedium = "responseMedium",
    mailchimpMemberId = "mailchimpMemberId",
    mailchimpUniqueEmailId = "mailchimpUniqueEmailId",
    memberEmail = "memberEmail",
    memberFirstName = "memberFirstName",
    memberLastName = "memberLastName",
    content = "content",
    promptId = "promptId",
    promptQuestion = "promptQuestion",
    reflectionDurationMs = "reflectionDurationMs",
    shared = "shared",
    cactusElement = "cactusElement"
}

export default class ReflectionResponse extends BaseModel {
    readonly collection = Collection.reflectionResponses;
    static Field = ReflectionResponseField;
    userId?: string;
    cactusMemberId?: string;
    anonymous: boolean = false;
    responseDate?: Date;
    emailReplyId?: string;
    responseMedium?: ResponseMedium;
    mailchimpMemberId?: string;
    mailchimpUniqueEmailId?: string;
    memberEmail?: string;
    memberFirstName?: string;
    memberLastName?: string;
    content: ReflectionContent = {};
    promptId?: string;
    promptQuestion?: string;
    reflectionDurationMs?: number = 0;
    shared: boolean = false;
    sharedAt?: Date;
    unsharedAt?: Date;
    cactusElement?: CactusElement | null;
    reflectionDates: Date[] = [];

    /**
     * Only Add a date log if the new date is not within 10 minutes of an existing date
     * @param {Date} date
     * @param {number=10} thresholdInMinutes - the threshold to look at for deciding if they recently have an entry
     * @returns {boolean} Returns `true` if the date was added to the array, `false` if it was skipped
     */
    addReflectionLog(date: Date, thresholdInMinutes: number = 10): boolean {
        const time = date.getTime();
        const recentDate = this.reflectionDates.find(d => {
            return Math.abs(d.getTime() - time) < thresholdInMinutes * 1000 * 60
        });

        if (recentDate) {
            return false
        }

        this.reflectionDates.push(date);
        return true
    }

    decodeJSON(json: any) {
        super.decodeJSON(json);

        this.sharedAt = json.sharedAt ? new Date(json.sharedAt) : undefined;
        this.unsharedAt = json.unsharedAt ? new Date(json.unsharedAt) : undefined;
        const dateArray = (json.reflectionDates || []) as number[];
        this.reflectionDates = dateArray.map((timestamp: number) => {
            return new Date(timestamp)
        })
    }

    getMemberFullName(): string {
        return `${this.memberFirstName || ""} ${this.memberLastName || ""}`.trim();
    }
}