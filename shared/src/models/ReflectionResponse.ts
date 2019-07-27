import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum ResponseMedium {
    EMAIL = "EMAIL",
    JOURNAL_WEB = "JOURNAL_WEB",
    JOURNAL_IOS = "JOURNAL_IOS",
    JOURNAL_ANDROID = "JOURNAL_ANDROID"
}

export function getResponseMediumDisplayName(medium?: ResponseMedium): string {
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
        default:
            displayName = "Unknown";
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
    content = "content",
    promptId = "promptId",
    promptQuestion = "promptQuestion",
}

export default class ReflectionResponse extends BaseModel {
    readonly collection = Collection.reflectionResponses;
    static Field = ReflectionResponseField;
    userId?: string;
    cactusMemberId?: string;
    responseDate?: Date;
    emailReplyId?: string;
    responseMedium?: ResponseMedium;
    mailchimpMemberId?: string;
    mailchimpUniqueEmailId?: string;
    memberEmail?: string;
    content: ReflectionContent = {};
    promptId?: string;
    promptQuestion?: string
}