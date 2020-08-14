import { BaseModel, Collection } from "@shared/FirestoreBaseModels";

export enum PendingUserFields {
    email = "email",
    referredByEmail = "referredByEmail",
    magicLinkSentAt = "magicLinkSentAt",
    signupCompletedAt = "signupCompletedAt",
    signupCompleted = "signupCompleted",
    signupCanceled = "signupCanceled",
    signupCanceledAt = "signupCanceledAt",
    userId = "userId",
    status = "status",
}

export enum PendingUserStatus {
    PENDING = "PENDING",
    CANCELED = "CANCELED",
    COMPLETED = "COMPLETED",
}

export default class PendingUser extends BaseModel {
    static Field = PendingUserFields;

    collection = Collection.pendingUsers;
    referredByEmail?: string;
    email?: string;
    magicLinkSentAt?: Date;
    signupCompletedAt?: Date;
    signupCompleted: boolean = false;
    signupCanceledAt?: Date;
    signupCanceled = false;
    usedPreviousReferrer = false;
    previousReferrerPendingUserId?: string;
    status: PendingUserStatus = PendingUserStatus.PENDING;
    userId?: string;
    //TODO: Do we need to track the possibility of multiple referreredByEmails?
    reflectionResponseIds: string[] = [];
    queryParams: { [name: string]: string | null } = {};

}