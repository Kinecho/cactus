import AdminFirestoreService, {
    DeleteOptions,
    FieldValue,
    QueryOptions,
    SaveOptions
} from "@admin/services/AdminFirestoreService";
import ReflectionResponse, { ReflectionResponseField } from "@shared/models/ReflectionResponse";

import { BaseModelField, Collection } from "@shared/FirestoreBaseModels";
import MailchimpService from "@admin/services/MailchimpService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import { getDateAtMidnightDenver, getDateFromISOString, getMailchimpDateString } from "@shared/util/DateUtil";
import {
    MergeField,
    TagName,
    TagStatus,
    UpdateMergeFieldRequest,
    UpdateMergeFieldResponse,
    UpdateTagResponse,
    UpdateTagsRequest
} from "@shared/mailchimp/models/MailchimpTypes";
import { ApiResponse } from "@shared/api/ApiTypes";
import { WordCloudExclusionList } from "@shared/util/LanguageUtil";
import CactusMember, { ReflectionStats } from "@shared/models/CactusMember";
import {
    calculateDurationMs,
    calculateStreaks,
    getElementAccumulationCounts
} from "@shared/util/ReflectionResponseUtil";
import { QuerySortDirection } from "@shared/types/FirestoreConstants";
import { AxiosError } from "axios";
import Logger from "@shared/Logger";
import GoogleLanguageService from "@admin/services/GoogleLanguageService";
import ToneAnalyzerService from "@admin/services/ToneAnalyzerService";
import { InsightWord } from "@shared/api/InsightLanguageTypes";

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

    async getMemberResponsesForPromptId(opts: { memberId?: string, promptId?: string, limit?: number }): Promise<ReflectionResponse[]> {
        const { promptId, memberId, limit } = opts;
        if (!memberId || !promptId) {
            return [];
        }
        let query = this.getCollectionRef().where(ReflectionResponse.Field.promptId, "==", promptId)
        .where(ReflectionResponse.Field.cactusMemberId, "==", memberId);

        if (limit) {
            query = query.limit(limit);
        }

        const results = await this.firestoreService.executeQuery(query, ReflectionResponse);

        return results.results
    }

    async getResponsesForPromptId(promptId: string): Promise<ReflectionResponse[]> {
        const query = this.getCollectionRef().where(ReflectionResponse.Field.promptId, "==", promptId);
        const results = await this.firestoreService.executeQuery(query, ReflectionResponse);

        return results.results
    }

    /**
     * Set last journal date in mailchimp
     * @param {string} email
     * @param {Date} date
     * @return {Promise<ApiResponse>}
     */
    static async setLastJournalDate(email?: string, date?: Date): Promise<ApiResponse> {
        const mailchimpService = MailchimpService.getSharedInstance();

        if (!email) {
            logger.warn("No email provided to setLastJournalDate function");
            return { success: false, error: "No email provided" };
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

    /**
     * Update mailchimp member reminder settings
     * @param {string} email
     * @return {Promise<ResetUserResponse>}
     */
    static async resetUserReminder(email?: string): Promise<ResetUserResponse> {
        try {
            const mailchimpService = MailchimpService.getSharedInstance();
            const memberService = AdminCactusMemberService.getSharedInstance();
            if (!email) {
                logger.warn("No email given provided to resetUserReminder function");
                return {
                    success: false,
                    unknownError: "No email provided to resetUser function",
                    mergeResponse: { success: false },
                    tagResponse: { success: false }
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

            await memberService.updateLastReplyByEmail(email, lastReplyDate);

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
                mergeResponse: { success: false },
                tagResponse: { success: false }
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

    async getResponsesForMember(options: { memberId: string, limit?: number }, queryOptions: QueryOptions = {}): Promise<ReflectionResponse[]> {
        const { memberId, limit } = options;

        let query = this.getCollectionRef().where(ReflectionResponse.Field.cactusMemberId, "==", memberId);

        if (limit) {
            query = query.limit(limit)
        }

        query = query.orderBy(ReflectionResponse.Field.updatedAt, QuerySortDirection.desc);

        if (queryOptions.queryName) {
            queryOptions.queryName = queryOptions.queryName + "_AdminReflectionResponseService.getResponsesForMember";
        } else {
            queryOptions.queryName = "AdminReflectionResponseService.getResponsesForMember";
        }

        const result = await this.firestoreService.executeQuery(query, ReflectionResponse, queryOptions);
        return result.results
    }

    async getLatestResponseForMember(memberId?: string): Promise<ReflectionResponse | undefined> {
        if (!memberId) {
            return undefined;
        }
        const query = this.getCollectionRef().where(ReflectionResponse.Field.cactusMemberId, "==", memberId)
        .orderBy(BaseModelField.createdAt, "desc");
        return this.firestoreService.getFirst(query, ReflectionResponse);
    }

    async calculateStatsForMember(options: { memberId: string, timeZone?: string }, queryOptions?: QueryOptions): Promise<ReflectionStats | undefined> {
        try {
            const { memberId, timeZone } = options;
            if (!memberId) {
                logger.error("No memberId provided to calculate stats.");
                return
            }

            const reflections = await this.getResponsesForMember({ memberId }, queryOptions);
            const { dayStreak, weekStreak, monthStreak } = calculateStreaks(reflections, { timeZone });
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

    async aggregateWordInsightsForMember(options: { memberId: string, reflectionLimit?: number }, queryOptions?: QueryOptions): Promise<InsightWord[] | undefined> {
        try {
            const { memberId, reflectionLimit = 7 } = options;
            if (!memberId) {
                logger.error("No memberId provided to calculate stats.");
                return
            }

            const reflections = await this.getResponsesForMember({ memberId, limit: reflectionLimit }, queryOptions);
            const wordStats: { [key: string]: InsightWord } = {};
            const wordCloud: InsightWord[] = [];

            if (reflections) {
                reflections.forEach(reflection => {
                    if (reflection.insights?.insightWords) {
                        reflection.insights.insightWords.forEach(wordInsight => {
                            // don't include words in the exclusion list
                            if (WordCloudExclusionList.includes(wordInsight.word)) {
                                return;
                            }
                            // don't include words with apostrophes / quotes that are less than 4 chars long
                            if (wordInsight.word && /['’"`]/.test(wordInsight.word) && wordInsight.word.length <= 4) {
                                return;
                            }

                            if (wordInsight.word) {
                                const normalizedWord = wordInsight.word.toLowerCase();

                                if (wordStats[normalizedWord]) {
                                    const aggFrequency = wordStats[normalizedWord].frequency;
                                    const aggSalience = wordStats[normalizedWord].salience;
                                    if (aggFrequency) {
                                        wordStats[normalizedWord].frequency = aggFrequency + 1;
                                    }
                                    if (aggSalience && wordInsight.salience) {
                                        wordStats[normalizedWord].salience = (aggSalience + wordInsight.salience) / 2;
                                    }
                                } else {
                                    wordStats[normalizedWord] = {
                                        word: wordInsight.word,
                                        frequency: 1,
                                        salience: wordInsight.salience || 0
                                    }
                                }
                            }
                        });
                    }
                });
            }

            if (wordStats) {
                for (const word in wordStats) {
                    wordCloud.push({
                        word: word,
                        frequency: wordStats[word].frequency,
                        salience: (wordStats[word].salience || 0) * (wordStats[word].frequency || 1)
                    });
                }
            }

            // sort array by salience
            wordCloud.sort((a: InsightWord, b: InsightWord) => (b.salience || 0) - (a.salience || 0));

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

        logger.log(`Permanently deleted ${ totalDeleted } reflection responses for member ${ member.email || member.id }`)
        return totalDeleted
    }

    async setMightNeedInsights(responseId: string, mightNeedInsights: boolean): Promise<void> {
        try {
            const doc = this.getCollectionRef().doc(responseId);
            await doc.update({ [ReflectionResponse.Field.mightNeedInsightsUpdate]: mightNeedInsights })
        } catch (error) {
            logger.error("Failed to update response might need insights")
        }
    }

    async getAllBatch(options: {
        batchSize?: number,
        onData: (sentPrompts: ReflectionResponse[], batchNumber: number) => Promise<void>
    }) {
        logger.log("Getting batched result 1 for all members");
        const query: FirebaseFirestore.Query = this.getCollectionRef();

        await AdminFirestoreService.getSharedInstance().executeBatchedQuery({
            query,
            type: ReflectionResponse,
            onData: options.onData,
            batchSize: options.batchSize,
            sortDirection: QuerySortDirection.asc,
            orderBy: BaseModelField.createdAt
        })
    }

    async updateTextAnalysis(response?: ReflectionResponse): Promise<ReflectionResponse | undefined> {
        const responseId = response?.id;
        if (!response || !responseId) {
            return undefined;
        }

        const doc = this.getCollectionRef().doc(responseId);
        const text = response.content.text;
        const [wordCloud, sentiment, toneAnalysis] = await Promise.all([
            GoogleLanguageService.getSharedInstance().insightWords(text),
            GoogleLanguageService.getSharedInstance().getSentiment(text),
            ToneAnalyzerService.shared.watsonBasicSdk(text),
        ]);

        await doc.set({
            [ReflectionResponse.Field.insights]: wordCloud ?? null,
            [ReflectionResponse.Field.toneAnalysis]: toneAnalysis ?? null,
            [ReflectionResponse.Field.sentiment]: sentiment ?? null,
            [ReflectionResponse.Field.mightNeedInsightsUpdate]: false,
            [ReflectionResponse.Field.insightsUpdatedAt]: FieldValue.serverTimestamp(),
        }, { merge: true });

        return undefined;
    }

    async updateToneAnalysis(response?: ReflectionResponse): Promise<void> {
        if (!response) {
            return;
        }


    }
}