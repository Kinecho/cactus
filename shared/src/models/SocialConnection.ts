import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum SocialConnectionFields {
    memberId = "memberId",
    friendId = "friendId",
    confirmed = "confirmed",
    sentAt = "sentAt",
    confirmedAt = "confirmedAt"
}

export default class SocialConnection extends BaseModel {
    readonly collection = Collection.socialConnections;
    static Fields = SocialConnectionFields;
    memberId?: string;
    friendId?: string;
    confirmed?: boolean;
    sentAt?: Date;
    confirmedAt?: Date;
}