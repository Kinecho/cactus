import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum SocialInviteField {
    senderMemberId = "senderMemberId",
    recipientEmail = "recipientEmail",
    sentAt = "sentAt",
    didJoin = "didJoin"
}

export default class SocialInvite extends BaseModel {
    static Field = SocialInviteField;
    senderMemberId: string;
    recipientEmail: string;
    sentAt: Date;
    didJoin: boolean
}