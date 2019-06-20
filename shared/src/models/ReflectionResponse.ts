import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum ResponseMedium {
    EMAIL = "EMAIL",
    UNKNOWN = "UNKNOWN",
}

export interface ReflectionContent {
    text?:string;
}

export default class ReflectionResponse extends BaseModel {
    readonly collection = Collection.reflectionResponses;

    emailReplyId?:string;
    responseMedium = ResponseMedium.UNKNOWN;
    mailchimpUniqueEmailId?: string;
    memberEmail?: string;
    content:ReflectionContent = {};
    promptId?:string;
    promptText?:string

}