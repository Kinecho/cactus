import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum SocialConnectionFields {
    memberId = "memberId",
    friendMemberId = "friendMemberId",
    createdAt = "createdAt"
}

export default class SocialConnection extends BaseModel {
    readonly collection = Collection.socialConnections;
    static Fields = SocialConnectionFields;
    memberId!: string;
    friendMemberId!: string;
}