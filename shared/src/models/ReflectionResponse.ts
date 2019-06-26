import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum ResponseMedium {
    EMAIL = "EMAIL",
}

export interface ReflectionContent {
    text?:string;
}

export default class ReflectionResponse extends BaseModel {
    readonly collection = Collection.reflectionResponses;

    responseDate?: Date;
    emailReplyId?:string;
    responseMedium?: ResponseMedium;
    mailchimpMemberId?: string;
    mailchimpUniqueEmailId?: string;
    memberEmail?: string;
    content:ReflectionContent = {};
    promptId?:string;
    promptQuestion?:string

}