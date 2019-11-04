import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum SocialInviteField {
    senderMemberId = "senderMemberId",
    recipientEmail = "recipientEmail",
    recipientMemberId = "recipientMemberId",
    sentAt = "sentAt",
    didJoin = "didJoin"
}

export default class SocialInvite extends BaseModel {
    readonly collection = Collection.invites;
    static Field = SocialInviteField;
    senderMemberId?: string;
    recipientEmail?: string;
    recipientMemberId?: string;
    sentAt?: Date;
    didJoin?: boolean
}