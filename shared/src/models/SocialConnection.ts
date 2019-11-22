import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum SocialConnectionFields {
    memberId = "memberId",
    friendMemberId = "friendMemberId",
    createdAt = "createdAt"
}

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
    memberId: string;
    friendMemberId: string;
    confirmedAt: Date | null;
    rejectedAt: Date | null;
    sentAt: Date;

    constructor() {
        super();
        this.memberId = '';
        this.friendMemberId = '';
        this.confirmedAt = null;
        this.rejectedAt = null;
        this.sentAt = new Date();
    }
}

export default class SocialConnection extends BaseModel {
    readonly collection = Collection.socialConnections;
    static Fields = SocialConnectionFields;
    memberId: string;
    friendMemberId: string;

    constructor() {
        super();
        this.memberId = '';
        this.friendMemberId = '';
    }
}