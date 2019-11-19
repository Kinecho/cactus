import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum SocialConnectionFields {
    memberId = "memberId",
    friendId = "friendId",
    confirmed = "confirmed",
    sentAt = "sentAt",
    confirmedAt = "confirmedAt",
    confirmedMembers = "confirmedMembers"
}

export enum SocialConnectionStatus {
    CONFIRMED = "confirmed",
    PENDING = "pending",
    NEEDS_CONFIRMATION = "confirmable"
}

export default class SocialConnection extends BaseModel {
    readonly collection = Collection.socialConnections;
    static Fields = SocialConnectionFields;
    memberId?: string;
    friendId?: string;
    confirmed?: boolean;
    sentAt?: Date;
    confirmedAt?: Date;
    confirmedMembers?: Array<string>;

    prepareForFirestore(): any {
        super.prepareForFirestore();
        
        this.confirmedMembers = [];

        if (this.memberId) {
            this.confirmedMembers.push(this.memberId);
        }

        if (this.confirmed && this.friendId) {
            this.confirmedMembers.push(this.friendId);
        }
        return this;
    }
}