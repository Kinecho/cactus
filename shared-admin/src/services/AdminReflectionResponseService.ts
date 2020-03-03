import AdminFirestoreService, {DeleteOptions, QueryOptions, SaveOptions} from "@admin/services/AdminFirestoreService";
import ReflectionResponse, {ReflectionResponseField, InsightWord} from "@shared/models/ReflectionResponse";
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
import {calculateDurationMs, calculateStreaks, getElementAccumulationCounts} from "@shared/util/ReflectionResponseUtil";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";
import {AxiosError} from "axios";
import Logger from "@shared/Logger";

const logger = new Logger("AdminReflectionResponseService");

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
        logger.error("no shared instance of AdminReflectionResponseService is yet available. Initializing it now (in the getter)");
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
        logger.log("getting response from collection", collection);

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
            logger.warn("No email provided to setLastJournalDate function");
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
        try {
            const mailchimpService = MailchimpService.getSharedInstance();
            const memberService = AdminCactusMemberService.getSharedInstance();
            if (!email) {
                logger.warn("No email given provided to resetUserReminder function");
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
        } catch (error) {
            if (error.isAxiosError) {
                const axiosError = error as AxiosError;
                logger.error("Unexpected error occurred while resetting the user's reminder. API Error", axiosError.response?.data || axiosError.response)
            } else {
                logger.error("Unexpected error occurred while resetting the user's reminder", error);
            }

            return {
                success: false,
                unknownError: error.isAxiosError ? error.response : error,
                mergeResponse: {success: false},
                tagResponse: {success: false}
            }
        }
    }

    async getResponseSinceDate(date: Date): Promise<ReflectionResponse[]> {
        const ts = AdminFirestoreService.Timestamp.fromDate(getDateAtMidnightDenver(date));

        const query = this.getCollectionRef().where(BaseModelField.createdAt, ">=", ts);

        try {
            const results = await AdminFirestoreService.getSharedInstance().executeQuery(query, ReflectionResponse);

            return results.results;
        } catch (error) {
            logger.error(error);
            return [];
        }
    }

    async getResponsesForMember(memberId: string, options?: QueryOptions): Promise<ReflectionResponse[]> {
        const query = this.getCollectionRef().where(ReflectionResponse.Field.cactusMemberId, "==", memberId);
        const queryOptions = options || {};
        if (queryOptions.queryName) {
            queryOptions.queryName = queryOptions.queryName + "_AdminReflectionResponseService.getResponsesForMember";
        } else {
            queryOptions.queryName = "AdminReflectionResponseService.getResponsesForMember";
        }

        const result = await this.firestoreService.executeQuery(query, ReflectionResponse, options);
        return result.results
    }

    async calculateStatsForMember(options: { memberId: string, timeZone?: string }, queryOptions?: QueryOptions): Promise<ReflectionStats | undefined> {
        try {
            const {memberId, timeZone} = options;
            if (!memberId) {
                logger.error("No memberId provided to calculate stats.");
                return
            }

            const reflections = await this.getResponsesForMember(memberId, queryOptions);
            const {dayStreak, weekStreak, monthStreak} = calculateStreaks(reflections, {timeZone});
            const duration = calculateDurationMs(reflections);

            const elementAccumulation = getElementAccumulationCounts(reflections);

            return {
                totalCount: reflections.length,
                currentStreakDays: dayStreak,
                currentStreakWeeks: weekStreak,
                currentStreakMonths: monthStreak,
                totalDurationMs: duration,
                elementAccumulation: elementAccumulation
            };
        } catch (error) {
            logger.error("Failed to calculate stats for memberId", options.memberId);
            return undefined;
        }

    }

    async aggregateWordInsightsForMember(options: { memberId: string }, queryOptions?: QueryOptions): Promise<InsightWord[] | undefined> {
        try {
            const {memberId} = options;
            if (!memberId) {
                logger.error("No memberId provided to calculate stats.");
                return
            }

            const reflections = await this.getResponsesForMember(memberId, queryOptions);
            let wordFrequencies: {[key: string]: number} = {};
            let wordCloud: InsightWord[] = [];

            if (reflections) {
                reflections.forEach(reflection => {
                    if (reflection.insights?.insightWords) {
                        reflection.insights.insightWords.forEach(wordInsight => {
                            if(wordFrequencies[wordInsight.word]) {
                               wordFrequencies[wordInsight.word]++;
                            } else {
                               wordFrequencies[wordInsight.word] = 1;
                            }
                        });
                    }
                });
            }

            if (wordFrequencies) {
                for (var word in wordFrequencies){
                  wordCloud.push({
                      word: word,
                      frequency: wordFrequencies[word]
                  });
                }
            }

            return wordCloud;
        } catch (error) {
            logger.error("Failed to calculate stats for memberId", options.memberId);
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

        logger.log(`Permanently deleted ${totalDeleted} reflection responses for member ${member.email || member.id}`)
        return totalDeleted
    }

    async getAllBatch(options: {
        batchSize?: number,
        onData: (sentPrompts: ReflectionResponse[], batchNumber: number) => Promise<void>
    }) {
        logger.log("Getting batched result 1 for all members");
        const query: FirebaseFirestore.Query = this.getCollectionRef();

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