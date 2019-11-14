import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum SocialConnectionField {
    memberId = "memberId",
    friendId = "friendId",
    confirmed = "confirmed",
    sentAt = "sentAt",
    confirmedAt = "confirmedAt"
}

export default class SocialConnection extends BaseModel {
    readonly collection = Collection.socialConnections;
    static Field = SocialConnectionField;
    memberId?: string;
    friendId?: string;
    confirmed?: boolean;
    sentAt?: Date;
    confirmedAt?: Date;
}