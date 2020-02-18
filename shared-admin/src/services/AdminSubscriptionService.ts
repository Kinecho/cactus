import AdminFirestoreService, {CollectionReference, GetBatchOptions} from "@admin/services/AdminFirestoreService";
import CactusMember from "@shared/models/CactusMember";
import {PremiumSubscriptionTiers} from "@shared/models/MemberSubscription";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminSendgridService from "@admin/services/AdminSendgridService";
import MailchimpService from "@admin/services/MailchimpService";
import {ApiResponse} from "@shared/api/ApiTypes";
import {MergeField, OperationStatus, UpdateMergeFieldRequest} from "@shared/mailchimp/models/MailchimpTypes";
import {Collection} from "@shared/FirestoreBaseModels";
import Logger from "@shared/Logger";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";
import {isString, stringifyJSON} from "@shared/util/ObjectUtil";
import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";
import {getHostname} from "@admin/config/configService";
import {PageRoute} from "@shared/PageRoutes";
import Stripe from "stripe";
import {CactusConfig} from "@shared/CactusConfig";
import {PaymentMethod, SubscriptionInvoice} from "@shared/models/SubscriptionTypes";
import {
    convertPaymentMethod,
    getInvoiceStatusFromStripeStatus,
    isStripePaymentMethod
} from "@admin/util/AdminStripeUtils";

export interface ExpireTrialResult {
    member: CactusMember,
    success: boolean,
    error?: string
}

interface MailchimpSyncSubscriberResult {
    membersProcessed: number,
    numSuccessUpdates: number,
    numFailedUpdates: number,
    totalDuration: number,
}

export default class AdminSubscriptionService {
    protected static sharedInstance: AdminSubscriptionService;
    firestoreService: AdminFirestoreService;
    logger = new Logger("AdminSubscriptionService");
    stripe: Stripe;
    config: CactusConfig;

    get membersCollection(): CollectionReference {
        return this.firestoreService.getCollectionRef(Collection.members);
    }

    static getSharedInstance(): AdminSubscriptionService {
        if (!AdminSubscriptionService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminSubscriptionService before using it");
        }
        return AdminSubscriptionService.sharedInstance;
    }

    static initialize(config: CactusConfig) {
        AdminSubscriptionService.sharedInstance = new AdminSubscriptionService(config);
    }

    private constructor(config: CactusConfig) {
        this.config = config;
        this.firestoreService = AdminFirestoreService.getSharedInstance();
        this.stripe = new Stripe(config.stripe.secret_key, {
            apiVersion: '2019-12-03',
        });
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

        const [updateSuccess, mailchimpResponse] = await Promise.all([
            this.updateSubscriptionTier({memberId, tier: SubscriptionTier.BASIC}),
            this.updateMailchimpListMember({member})
        ]);

        // notify them by email
        if (member?.email) {
            await AdminSendgridService.getSharedInstance().sendTrialEnding({
                toEmail: member.email,
                firstName: member?.firstName,
                link: `${getHostname()}${PageRoute.PAYMENT_PLANS}`
            });
        }

        return {
            success: updateSuccess && (mailchimpResponse.success ?? false),
            member,
            error: mailchimpResponse.error || updateSuccess ? undefined : "unable to update the cactus member's subscription tier",
        }
    }

    createMergeFieldRequests(members: CactusMember[]): UpdateMergeFieldRequest[] {
        const requests: UpdateMergeFieldRequest[] = [];
        members.forEach(member => {
            const job = this.createUpdateMergeFieldRequest(member);
            if (job) {
                requests.push(job);
            } else {
                this.logger.warn("Unable to create a merge field update job for member " + member.email);
            }
        });
        return requests;
    }

    async syncTrialingMemberWithMailchimp(): Promise<MailchimpSyncSubscriberResult> {
        const jobStart = Date.now();
        const result: MailchimpSyncSubscriberResult = {
            membersProcessed: 0,
            numFailedUpdates: 0,
            numSuccessUpdates: 0,
            totalDuration: 0
        };
        await this.getMembersInTrial({
            onData: async (members, batchNumber) => {
                const start = Date.now();
                this.logger.info(`Processing ${members.length} in batch #${batchNumber}`);
                members.forEach(m => this.logger.info("Processing member", m.email));
                result.membersProcessed += members.length;
                const requests = this.createMergeFieldRequests(members);
                if (requests.length > 0) {
                    this.logger.info(`Submitting ${requests.length} update merge tag jobs to the bulk update job\n${stringifyJSON(requests, 2)}`);
                    const batchRequests = await MailchimpService.getSharedInstance().bulkUpdateMergeFields(requests);
                    const batchResponses = await MailchimpService.getSharedInstance().waitForBatchJobs(batchRequests);
                    const failedResponses = batchResponses.filter(r => r.response?.status !== OperationStatus.finished);
                    if (failedResponses.length > 0) {
                        this.logger.error("Some batches failed: ", stringifyJSON(failedResponses));
                        result.numFailedUpdates += failedResponses.length;
                    }
                    const numSuccess = batchResponses.length - failedResponses.length;
                    result.numSuccessUpdates += numSuccess;
                    this.logger.info("successful batches: ", numSuccess);
                }
                const end = Date.now();
                this.logger.info(`Finished batch #${batchNumber} in ${end - start}ms`);
            }
        });
        const jobEnd = Date.now();
        result.totalDuration = jobEnd - jobStart;
        return result;
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

    /**
     * Get all members that are currently in a trial period.
     * @param {GetBatchOptions<CactusMember>} options
     * @return {Promise<void>}
     */
    async getMembersInTrial(options: GetBatchOptions<CactusMember>,) {
        const endDate = new Date();
        const query = this.firestoreService.getCollectionRef(Collection.members)
            .where(CactusMember.Field.subscriptionTier, "in", PremiumSubscriptionTiers)
            .where(CactusMember.Field.subscriptionTrialEndsAt, ">=", AdminFirestoreService.Timestamp.fromDate(endDate));

        await this.firestoreService.executeBatchedQuery({
            query,
            type: CactusMember,
            ...options,
            orderBy: CactusMember.Field.subscriptionTrialEndsAt,
            sortDirection: QuerySortDirection.asc
        })
    }

    async getMembersToExpireTrial(options: GetBatchOptions<CactusMember>) {
        const query = this.firestoreService.getCollectionRef(Collection.members)
            .where(CactusMember.Field.subscriptionTier, "in", PremiumSubscriptionTiers)
            .where(CactusMember.Field.subscriptionTrialEndsAt, "<=", AdminFirestoreService.Timestamp.fromDate(new Date()));

        await this.firestoreService.executeBatchedQuery({
            query,
            type: CactusMember,
            ...options,
            orderBy: CactusMember.Field.subscriptionTrialEndsAt,
            sortDirection: QuerySortDirection.asc
        })
    }

    createUpdateMergeFieldRequest(member: CactusMember): UpdateMergeFieldRequest | undefined {
        if (!member?.email) {
            this.logger.warn("No member could be found in the updateMailchimpListMember function");
            return undefined;
        }

        const email = member.email;
        const subscription = member.subscription;

        if (!subscription) {
            this.logger.warn("No subscription was found on cactus member " + member.email);
            return undefined
        }

        const subscriptionTier = subscription.tier || SubscriptionTier.BASIC;
        const isTrialing = member.isInTrial ? "YES" : "NO";
        const trialDaysLeft = member.daysLeftInTrial;

        const mergeFieldRequest: UpdateMergeFieldRequest = {
            email,
            mergeFields: {
                [MergeField.SUB_TIER]: subscriptionTier,
                [MergeField.IN_TRIAL]: isTrialing,
                [MergeField.TDAYS_LEFT]: trialDaysLeft,
            }
        };
        return mergeFieldRequest
    }

    async updateMailchimpListMember(options: { memberId?: string, member?: CactusMember }): Promise<ApiResponse> {
        const mailchimpService = MailchimpService.getSharedInstance();
        const {memberId} = options;
        let {member} = options;

        if (!memberId || !member) {
            this.logger.warn("No memberId provided to updateMailchimpListMember function");
            return {success: false, error: "No member or memberId provided"};
        }

        if (!member && memberId) {
            member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
        }

        if (!member) {
            this.logger.warn("No member was found");
            return {success: false, error: "No member was found"};
        }

        const email = member?.email;
        const subscription = member?.subscription;

        if (!email) {
            this.logger.warn("No member could be found in the updateMailchimpListMember function");
            return {success: false, error: "No member was found"};
        }

        if (!subscription) {
            this.logger.warn("No subscription was found on cactus member " + email);
            return {
                success: false,
                error: "No subscription was found on the member, can not update mailchimp."
            }
        }

        const mergeFieldRequest = this.createUpdateMergeFieldRequest(member);
        if (!mergeFieldRequest) {
            this.logger.warn("Unable to create an updateMergeFieldRequest");
            return {success: false, error: "Unable to create an updatedMergeFieldRequest"};
        }
        return await mailchimpService.updateMergeFields(mergeFieldRequest);
    }

    async getStripeCustomer(customerId: string, expand?: string[]): Promise<Stripe.Customer | undefined> {
        try {
            const customer = await this.stripe.customers.retrieve(customerId, {expand});
            if ((customer as Stripe.DeletedCustomer).deleted) {
                return undefined;
            }
            return customer as Stripe.Customer;
        } catch (error) {
            this.logger.error(`Failed to get the stripe customer for customerId = ${customerId}`, error);
            return undefined;
        }
    }

    async getDefaultStripeSourceId(customerId: string): Promise<string | undefined> {
        const customer = await this.getStripeCustomer(customerId);
        if (!customer) {
            return undefined;
        }
        if (isString(customer.default_source)) {
            return customer.default_source;
        }
        return undefined;
    }

    async getDefaultStripeInvoicePaymentMethod(customerId: string): Promise<PaymentMethod | undefined> {
        const customer = await this.getStripeCustomer(customerId, ["invoice_settings.default_payment_method"]);
        if (!customer) {
            return undefined;
        }
        const paymentMethod = customer.invoice_settings?.default_payment_method;
        if (isStripePaymentMethod(paymentMethod)) {
            return convertPaymentMethod(paymentMethod);
        } else {
            this.logger.warn(`Unable to build payment method from invoice_settings.default_payment_method ${JSON.stringify(paymentMethod, null, 2)}`);
        }
        return;
    }

    async getUpcomingStripeInvoice(options: { customerId?: string, subscriptionId?: string }): Promise<SubscriptionInvoice | undefined> {
        const {customerId: stripeCustomerId, subscriptionId: stripeSubscriptionId} = options;
        if (!stripeCustomerId && !stripeSubscriptionId) {
            this.logger.warn("No stripeCustomerId or stripeSubscriptionId found on the member. Can not fetch subscription details.");
            return undefined;
        }
        try {
            const stripeInvoice = await this.stripe.invoices.retrieveUpcoming({
                customer: stripeCustomerId,
                subscription: stripeSubscriptionId,
                expand: ["default_payment_method"]
            });
            if (!stripeInvoice) {
                this.logger.info("No upcoming invoices found.");
                return undefined;
            }

            let defaultPaymentMethod: PaymentMethod | undefined;
            if (isStripePaymentMethod(stripeInvoice.default_payment_method)) {
                defaultPaymentMethod = convertPaymentMethod(stripeInvoice.default_payment_method);
            }
            const invoice: SubscriptionInvoice = {
                status: getInvoiceStatusFromStripeStatus(stripeInvoice.status),
                amountCentsUsd: stripeInvoice.total,
                defaultPaymentMethod,
                periodStart_epoch_seconds: stripeInvoice.period_start,
                periodEnd_epoch_seconds: stripeInvoice.period_end,
                nextPaymentDate_epoch_seconds: stripeInvoice.next_payment_attempt || undefined,
                paid: stripeInvoice.paid,
                stripeInvoiceId: stripeInvoice.id,
            };
            this.logger.info("Built invoice object", stringifyJSON(invoice, 2));
            return invoice;

        } catch (error) {
            this.logger.warn(`No upcoming invoice found for| customerId ${stripeCustomerId} | stripeSubscriptionId ${stripeSubscriptionId}`)
            return undefined;
        }
    }

    async getUpcomingInvoice(options: { member: CactusMember }): Promise<SubscriptionInvoice | undefined> {
        const {member} = options;
        const stripeCustomerId = member.stripeCustomerId;
        const stripeSubscriptionId = member.subscription?.stripeSubscriptionId;

        let invoice: SubscriptionInvoice | undefined;
        if (stripeCustomerId || stripeSubscriptionId) {
            invoice = await this.getUpcomingStripeInvoice({
                customerId: stripeCustomerId,
                subscriptionId: stripeSubscriptionId
            });
        }
        //TODO: Handle for fetching invoices from Apple, Google, etc

        return invoice;
    }
}