import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import ListMember from "@shared/mailchimp/models/ListMember";

export enum JournalStatus {
    PREMIUM = "PREMIUM",
    NONE = "NONE",
}

export enum Field {
    firstName = "firstName",
    lastName = "lastName",
    email = "email",
    userId = "userId",
    joinedAt = "joinedAt",
    lastSyncedAt = "lastSyncedAt",
    mailchimpListMemberId = "mailchimpListMember.id",
    mailchimpListMemberUniqueEmailId = "mailchimpListMember.unique_email_id",
    mailchimpListMemberWebId = "mailchimpListMember.web_id",
}

export default class CactusMember extends BaseModel {
    readonly collection = Collection.members;
    firstName?:string;
    lastName?:string;
    email?:string;
    joinedAt?:Date;
    userId?:string;

    mailchimpListMember?:ListMember;
    lastSyncedAt?:Date;
    lastReplyAt?: Date;

    journalStatus=JournalStatus.NONE;
}