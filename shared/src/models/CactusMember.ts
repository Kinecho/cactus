import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import {ListMember} from "@shared/mailchimp/models/MailchimpTypes";

export enum JournalStatus {
    PREMIUM = "PREMIUM",
    NONE = "NONE",
    TESTER = "TESTER"
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
    journalStatus = "journalStatus",
}

export default class CactusMember extends BaseModel {
    readonly collection = Collection.members;
    firstName?:string;
    lastName?:string;
    email?:string;
    signupAt?:Date;
    signupConfirmedAt?:Date;
    userId?:string;

    mailchimpListMember?:ListMember;
    lastSyncedAt?:Date;
    lastReplyAt?: Date;

    unsubscribeReason?:string;
    unsubscribedAt?:Date;

    journalStatus=JournalStatus.NONE;

    prepareForFirestore(): any {
        super.prepareForFirestore();
        this.email = this.email ? this.email.toLowerCase().trim() : this.email;
        return this;
    }
}