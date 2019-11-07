import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum SocialInviteField {
    senderMemberId = "senderMemberId",
    recipientEmail = "recipientEmail",
    recipientMemberId = "recipientMemberId",
    sentAt = "sentAt",
    source = "source"
}

export enum SocialInviteSource {
    IMPORTED_EMAIL = "imported_email",
    PUBLIC_LINK = "public_link"
}

export default class SocialInvite extends BaseModel {
    readonly collection = Collection.socialInvites;
    static Field = SocialInviteField;
    senderMemberId?: string;
    recipientEmail?: string;
    recipientMemberId?: string;
    sentAt?: Date;
    source?: SocialInviteSource;
}