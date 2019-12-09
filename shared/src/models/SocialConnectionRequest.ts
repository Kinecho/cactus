import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum SocialConnectionRequestFields {
    memberId = "memberId",
    friendMemberId = "friendMemberId",
    confirmedAt = "confirmedAt",
    rejectedAt = "rejectedAt",
    sentAt = "sentAt"
}

export class SocialConnectionRequest extends BaseModel {
    readonly collection = Collection.socialConnectionRequests;
    static Fields = SocialConnectionRequestFields;
    memberId!: string;
    friendMemberId!: string;
    confirmedAt: Date | null = null;
    rejectedAt: Date | null = null;
    sentAt: Date = new Date();
}