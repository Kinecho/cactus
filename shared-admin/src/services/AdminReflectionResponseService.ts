import AdminFirestoreService, {DeleteOptions, QueryOptions, SaveOptions} from "@admin/services/AdminFirestoreService";
import ReflectionResponse, {ReflectionResponseField} from "@shared/models/ReflectionResponse";
import {BaseModelField, Collection} from "@shared/FirestoreBaseModels";
import MailchimpService from "@admin/services/MailchimpService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import {getDateAtMidnightDenver, getDateFromISOString, getMailchimpDateString} from "@shared/util/DateUtil";
import {
    MergeField,
    TagName,
    TagStatus,
    UpdateMergeFieldRequest,
    UpdateMergeFieldResponse,
    UpdateTagResponse,
    UpdateTagsRequest
} from "@shared/mailchimp/models/MailchimpTypes";
import {ApiResponse} from "@shared/api/ApiTypes";
import CactusMember, {ReflectionStats} from "@shared/models/CactusMember";
import {calculateDurationMs, calculateStreak, getElementAccumulationCounts} from "@shared/util/ReflectionResponseUtil";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";


export interface ResetUserResponse {
    success: boolean
    unknownError?: any
    mergeResponse: UpdateMergeFieldResponse,
    tagResponse: UpdateTagResponse,
    lastReplyString?: string,
}


export default class AdminReflectionResponseService {
    protected static sharedInstance: AdminReflectionResponseService;

    public static initialize(): AdminReflectionResponseService {
        AdminReflectionResponseService.sharedInstance = new AdminReflectionResponseService();
        return AdminReflectionResponseService.sharedInstance;
    }

    public static getSharedInstance(): AdminReflectionResponseService {
        if (AdminReflectionResponseService.sharedInstance) {
            return AdminReflectionResponseService.sharedInstance;
        }
        console.error("no shared instance of AdminReflectionResponseService is yet available. Initializing it now (in the getter)");
        return AdminReflectionResponseService.initialize();

    }

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.reflectionResponses);
    }

    firestoreService: AdminFirestoreService;

    constructor() {
        this.firestoreService = AdminFirestoreService.getSharedInstance();

    }

    async save(model: ReflectionResponse, options?: SaveOptions): Promise<ReflectionResponse> {
        return this.firestoreService.save(model, options);
    }

    async getById(id?: string): Promise<ReflectionResponse | undefined> {
        if (!id) {
            return;
        }

        return this.firestoreService.getById(id, ReflectionResponse);
    }

    async getResponseForCampaignId(memberId: string, campaignId: string): Promise<ReflectionResponse> {
        const collection = this.firestoreService.getCollectionRef(Collection.reflectionResponses);
        // collection.where()
        console.log("getting response from collection", collection);

        throw new Error("Not implemented");
    }

    async getMemberResponsesForPromptId(opts: { memberId: string, promptId: string }): Promise<ReflectionResponse[]> {
        const {promptId, memberId} = opts;
        if (!memberId) {
            return [];
        }
        const query = this.getCollectionRef().where(ReflectionResponse.Field.promptId, "==", promptId)
            .where(ReflectionResponse.Field.cactusMemberId, "==", memberId);
        const results = await this.firestoreService.executeQuery(query, ReflectionResponse);

        return results.results
    }

    async getResponsesForPromptId(promptId: string): Promise<ReflectionResponse[]> {
        const query = this.getCollectionRef().where(ReflectionResponse.Field.promptId, "==", promptId);
        const results = await this.firestoreService.executeQuery(query, ReflectionResponse);

        return results.results
    }

    static async setLastJournalDate(email?: string, date?: Date): Promise<ApiResponse> {
        const mailchimpService = MailchimpService.getSharedInstance();

        if (!email) {
            console.warn("No email provided to setLastJournalDate function");
            return {success: false, error: "No email provided"};
        }

        const lastJournalString = getMailchimpDateString(date);
        const lastJournalDate = getDateFromISOString(lastJournalString);
        const mergeRequest: UpdateMergeFieldRequest = {
            email,
            mergeFields: {
                [MergeField.LAST_JNL]: lastJournalString
            }
        };

        const mergeResponse = await mailchimpService.updateMergeFields(mergeRequest);
        await AdminCactusMemberService.getSharedInstance().updateLastJournalByEmail(email, lastJournalDate);
        return mergeResponse;

    }

    static async resetUserReminder(email?: string): Promise<ResetUserResponse> {
        const mailchimpService = MailchimpService.getSharedInstance();
        const memberService = AdminCactusMemberService.getSharedInstance();
        if (!email) {
            console.warn("No email given provided to resetUserReminder function");
            return {
                success: false,
                unknownError: "No email provided to resetUser function",
                mergeResponse: {success: false},
                tagResponse: {success: false}
            };
        }

        const lastReplyString = getMailchimpDateString();
        const lastReplyDate = getDateFromISOString(lastReplyString);
        const mergeRequest: UpdateMergeFieldRequest = {
            email,
            mergeFields: {
                [MergeField.LAST_REPLY]: lastReplyString
            }
        };

        const mergeResponse = await mailchimpService.updateMergeFields(mergeRequest);

        const tagRequest: UpdateTagsRequest = {
            email,
            tags: [
                {
                    name: TagName.NEEDS_ONBOARDING_REMINDER,
                    status: TagStatus.INACTIVE
                },
            ]
        };

        await memberService.updateLastReplyByEmail(email, lastReplyDate);

        const tagResponse = await mailchimpService.updateTags(tagRequest);

        return {
            success: tagResponse.success && tagResponse.success,
            tagResponse,
            mergeResponse,
            lastReplyString: lastReplyString
        };
    }

    async getResponseSinceDate(date: Date): Promise<ReflectionResponse[]> {
        const ts = AdminFirestoreService.Timestamp.fromDate(getDateAtMidnightDenver(date));

        const query = this.getCollectionRef().where(BaseModelField.createdAt, ">=", ts);

        try {
            const results = await AdminFirestoreService.getSharedInstance().executeQuery(query, ReflectionResponse);

            return results.results;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    async getResponsesForMember(memberId: string, options?: QueryOptions): Promise<ReflectionResponse[]> {
        const query = this.getCollectionRef().where(ReflectionResponse.Field.cactusMemberId, "==", memberId);
        const result = await this.firestoreService.executeQuery(query, ReflectionResponse, options);
        return result.results
    }

    async calculateStatsForMember(options: { memberId: string, timeZone?: string }, queryOptions?: QueryOptions): Promise<ReflectionStats | undefined> {
        try {
            const {memberId} = options;
            let timeZone = options.timeZone;
            if (!memberId) {
                console.error("No memberId provided to calculate stats.");
                return
            }

            if (!timeZone) {
                console.log("AdminReflectionResponseService.calculateStatsForMember: No timezone provided, attempting to get it from the member");
                const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
                timeZone = member?.timeZone || undefined;
            }

            const reflections = await this.getResponsesForMember(memberId, queryOptions);
            const streak = calculateStreak(reflections, {timeZone});
            const duration = calculateDurationMs(reflections);

            const elementAccumulation = getElementAccumulationCounts(reflections);

            return {
                totalCount: reflections.length,
                currentStreakDays: streak,
                totalDurationMs: duration,
                elementAccumulation: elementAccumulation
            };
        } catch (error) {
            console.error("Failed to calculate stats for memberId", options.memberId);
            return undefined;
        }

    }

    async deletePermanentlyForMember(member: CactusMember | { email?: string, id?: string }, options?: DeleteOptions): Promise<number> {
        let totalDeleted = 0;
        if (member.email) {
            const query = this.getCollectionRef().where(ReflectionResponseField.memberEmail, "==", member.email);
            const emailNumber = await this.firestoreService.deletePermanentlyForQuery(query, options);
            totalDeleted += emailNumber;
        }

        if (member.id) {
            const query = this.getCollectionRef().where(ReflectionResponseField.cactusMemberId, "==", member.id);
            const idNumber = await this.firestoreService.deletePermanentlyForQuery(query, options);
            totalDeleted += idNumber;
        }

        console.log(`Permanently deleted ${totalDeleted} reflection responses for member ${member.email || member.id}`)
        return totalDeleted
    }

    async getAllBatch(options: {
        batchSize?: number,
        onData: (sentPrompts: ReflectionResponse[], batchNumber: number) => Promise<void>
    }) {
        console.log("Getting batched result 1 for all members");
        let query: FirebaseFirestore.Query = this.getCollectionRef();

        // if (options.excludeCompleted === true) {
        //     query = query.where(SentPromptField.completed, "==", false);
        // }

        // if (options.beforeDate) {
        //     query = query.where(BaseModelField.createdAt, "<", toTimestamp(options.beforeDate))
        // }

        await AdminFirestoreService.getSharedInstance().executeBatchedQuery({
            query,
            type: ReflectionResponse,
            onData: options.onData,
            batchSize: options.batchSize,
            sortDirection: QuerySortDirection.asc,
            orderBy: BaseModelField.createdAt
        })
    }
}