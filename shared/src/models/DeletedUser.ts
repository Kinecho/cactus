import { BaseModel, Collection } from "@shared/FirestoreBaseModels";
import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import CactusMember from "@shared/models/CactusMember";
import { MemberSubscription } from "@shared/models/MemberSubscription";

export default class DeletedUser extends BaseModel {
    readonly collection = Collection.deletedUsers;

    userId: string | undefined;
    memberId!: string;
    memberCreatedAt?: Date;
    memberDeletedAt: Date = new Date();
    subscriptionTier?: SubscriptionTier;

    documentsDeleted: Record<string, number> = {};
    deletionErrors: string[] = [];
    subscription?: MemberSubscription;
    hasCoreValues: boolean;

    static create(result: { member: CactusMember, documentsDeleted?: Record<string, number>, errors?: string[] }): DeletedUser {
        const deletedUser = new DeletedUser();
        const m = result.member;
        deletedUser.memberId = m.id!;
        deletedUser.userId = m.userId;
        deletedUser.subscriptionTier = m.tier;
        deletedUser.id = m.id;
        deletedUser.memberCreatedAt = m.createdAt;
        deletedUser.memberDeletedAt = new Date();
        deletedUser.documentsDeleted = result.documentsDeleted ?? {};
        deletedUser.deletionErrors = result.errors ?? [];
        deletedUser.subscription = m.subscription;
        deletedUser.hasCoreValues = (m.coreValues?.length ?? 0) > 0;

        return deletedUser;
    }
}