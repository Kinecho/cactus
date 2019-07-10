import {BaseModel, BaseModelField, Collection} from "@shared/FirestoreBaseModels";

export enum ResponseMedium {
    EMAIL = "EMAIL",
    JOURNAL_WEB = "JOURNAL_WEB",
}

export interface ReflectionContent {
    text?: string;
}

export enum ReflectionResponseField {
    responseDate = "responseDate",
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