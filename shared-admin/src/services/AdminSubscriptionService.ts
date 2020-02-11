import AdminFirestoreService, {CollectionReference, GetBatchOptions} from "@admin/services/AdminFirestoreService";
import CactusMember from "@shared/models/CactusMember";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import MailchimpService from "@admin/services/MailchimpService";
import {ApiResponse} from "@shared/api/ApiTypes";
import {
    MergeField,
    UpdateMergeFieldRequest
} from "@shared/mailchimp/models/MailchimpTypes";
import {SubscriptionTier} from "@shared/models/MemberSubscription";
import {Collection} from "@shared/FirestoreBaseModels";
import Logger from "@shared/Logger";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";

export interface ExpireTrialResult {
    member: CactusMember,
    success: boolean,
    error?: string
}

export default class AdminSubscriptionService {
    protected static sharedInstance: AdminSubscriptionService;
    firestoreService: AdminFirestoreService;
    logger = new Logger("AdminSubscriptionService");

    get membersCollection(): CollectionReference {
        return this.firestoreService.getCollectionRef(Collection.members);
    }

    static getSharedInstance(): AdminSubscriptionService {
        if (!AdminSubscriptionService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminSubscriptionService before using it");
        }
        return AdminSubscriptionService.sharedInstance;
    }

    static initialize() {
        AdminSubscriptionService.sharedInstance = new AdminSubscriptionService();
    }

    private constructor() {
        this.firestoreService = AdminFirestoreService.getSharedInstance();
    }

    async expireTrial(member: CactusMember): Promise<ExpireTrialResult> {
        const memberId = member.id;
        if (!memberId) {
            return {
                success: false,
                error: "No member ID was found on the cactus member object.",
                member,
            }
        }
        const subscription = member.subscription;
        if (!subscription) {
            this.logger.warn("No subscription was found on cactus member " + member.email);
            return {
                success: false,
                error: "No subscription was found on the member, can not expire the trial.",
                member,
            }
        }

        subscription.tier = SubscriptionTier.BASIC;
        const updateSuccess = await this.updateSubscriptionTier({memberId, tier: SubscriptionTier.BASIC});

        return {
            success: updateSuccess,
            member,
            error: updateSuccess ? undefined : "unable to update the cactus member's subscription tier",
        }
    }

    /**
     * Set a subscription status on a Cactus Member
     * @param {{memberId: string, tier: SubscriptionTier}} options
     * @return {Promise<boolean>} true if the operation was successful
     */
    async updateSubscriptionTier(options: { memberId: string, tier: SubscriptionTier }): Promise<boolean> {
        const {memberId, tier} = options;
        try {
            const ref = this.membersCollection.doc(memberId);
            await ref.update({[CactusMember.Field.subscriptionTier]: tier});
            return true;
        } catch (error) {
            this.logger.error("Unable to set the subscription tier on member " + memberId);
            return false;
        }
    }

    async getMembersToExpireTrial(options: GetBatchOptions<CactusMember>) {
        const query = this.firestoreService.getCollectionRef(Collection.members).where(CactusMember.Field.subscriptionTier, "in", [SubscriptionTier.PLUS])
            .where(CactusMember.Field.subscriptionTrialEndsAt, "<=", AdminFirestoreService.Timestamp.fromDate(new Date()));

        await this.firestoreService.executeBatchedQuery({
            query,
            type: CactusMember, ...options,
            orderBy: CactusMember.Field.subscriptionTrialEndsAt,
            sortDirection: QuerySortDirection.asc
        })
    }

    async updateMailchimpListMember(options: { memberId: string }): Promise<ApiResponse> {
        const mailchimpService = MailchimpService.getSharedInstance();
        const {memberId} = options;
        
        if (!memberId) {
            this.logger.warn("No memberId provided to updateMailchimpListMember function");
            return {success: false, error: "No memberId provided"};
        }

        const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);

        if (!member?.email) {
            this.logger.warn("No member could be found in the updateMailchimpListMember function");
            return {success: false, error: "No member was found"};
        }

        const email = member.email;
        const subscription = member.subscription;

        if (!subscription) {
            this.logger.warn("No subscription was found on cactus member " + member.email);
            return {
                success: false,
                error: "No subscription was found on the member, can not update mailchimp."
            }
        }

        const subscriptionTier = subscription.tier || SubscriptionTier.BASIC;
        const isTrialing = member.isInTrial ? "YES" : "NO";
        const trialDaysLeft = member.daysLeftInTrial;
        
        const mergeRequest: UpdateMergeFieldRequest = {
            email,
            mergeFields: {
                [MergeField.SUB_TIER]: subscriptionTier,
                [MergeField.IN_TRIAL]: isTrialing,
                [MergeField.TDAYS_LEFT]: trialDaysLeft,
            }
        };

        const mergeResponse = await mailchimpService.updateMergeFields(mergeRequest);
        return mergeResponse;
    }
}