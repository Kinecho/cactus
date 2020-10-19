import AdminFirestoreService, {
    Batch,
    CollectionReference,
    DefaultGetOptions,
    FieldValue,
    GetBatchOptions,
    GetOptions,
    QueryOptions,
    SaveOptions,
    Timestamp
} from "@admin/services/AdminFirestoreService";
import CactusMember, {
    DEFAULT_PROMPT_SEND_TIME,
    Field,
    JournalStatus,
    NotificationStatus,
    PromptSendTime,
    ReflectionStats
} from "@shared/models/CactusMember";
import { BaseModelField, Collection } from "@shared/FirestoreBaseModels";
import { getDateAtMidnightDenver, getDateFromISOString, getSendTimeUTC, plusDays } from "@shared/util/DateUtil";
import {
    ListMember,
    ListMemberStatus,
    MemberUnsubscribeReport,
    TagName
} from "@shared/mailchimp/models/MailchimpTypes";
import { QuerySortDirection } from "@shared/types/FirestoreConstants";
import Logger from "@shared/Logger";
import { getValidTimezoneName } from "@shared/timezones";
import * as admin from "firebase-admin";
import { QueryWhereClauses, removeDuplicates } from "@shared/util/FirestoreUtil";
import { isBlank } from "@shared/util/StringUtil";
import { CoreValue } from "@shared/models/CoreValueTypes";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import HoboCache from "@admin/HoboCache";
import { InsightWord } from "@shared/api/InsightLanguageTypes";
import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import DocumentReference = admin.firestore.DocumentReference;

const logger = new Logger("AdminCactusMemberService");
let firestoreService: AdminFirestoreService;
const DEFAULT_BATCH_SIZE = 500;

export interface UpdateSendPromptUTCResult {
    updated: boolean,
    promptSendTimeUTC?: PromptSendTime,
    promptSendTime?: PromptSendTime
}

export interface GetMembersBatchOptions extends QueryOptions {
    lastMemberId?: string,
    lastCursor?: any,
    limit?: number,
    orderBy: string,
    sortDirection: QuerySortDirection,
    where?: QueryWhereClauses,
}

export default class AdminCactusMemberService {
    protected static sharedInstance: AdminCactusMemberService;

    static getSharedInstance(): AdminCactusMemberService {
        if (!AdminCactusMemberService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminCactusMemberService before using it");
        }
        return AdminCactusMemberService.sharedInstance;
    }

    static initialize() {
        firestoreService = AdminFirestoreService.getSharedInstance();
        AdminCactusMemberService.sharedInstance = new AdminCactusMemberService();
    }

    getCollectionRef(): CollectionReference {
        return AdminFirestoreService.getSharedInstance().getCollectionRef(Collection.members);
    }

    async deleteField(member: CactusMember, field: Field): Promise<void> {
        const memberId = member.id;
        if (!memberId) {
            return;
        }

        const docRef = this.getCollectionRef().doc(memberId);

        await docRef.update(field, FieldValue.delete());
        return;
    }

    async save(model: CactusMember, options?: SaveOptions): Promise<CactusMember> {
        return firestoreService.save(model, options);
    }

    async getById(id?: string, options?: GetOptions): Promise<CactusMember | undefined> {
        if (!id) {
            return undefined;
        }
        return await firestoreService.getById(id, CactusMember, options);
    }

    async getByStripeCustomerId(customerId: string, options?: GetOptions): Promise<CactusMember | undefined> {
        return await firestoreService.getFirst(this.getCollectionRef().where(CactusMember.Field.stripeCustomerId, "==", customerId), CactusMember, options)
    }

    async delete(id?: string): Promise<CactusMember | undefined> {
        if (!id) {
            return undefined
        }
        return firestoreService.delete(id, CactusMember);
    }

    async setStats(options: { memberId: string, stats?: ReflectionStats, wordCloud?: InsightWord[], batch?: Batch }, queryOptions?: SaveOptions): Promise<void> {
        const { memberId, stats, wordCloud } = options;
        const doc: DocumentReference = this.getCollectionRef().doc(memberId);
        const data: Partial<CactusMember> = {};

        if (stats) {
            data.stats = {
                reflections: stats
            }
        }

        if (wordCloud) {
            data.wordCloud = wordCloud;
        }

        if (data.stats || data.wordCloud) {
            try {
                if (queryOptions?.transaction) {
                    await queryOptions?.transaction.set(doc, data, { merge: true })
                } else if (options.batch) {
                    options.batch.set(doc, data, { merge: true })
                } else {
                    await doc.set(data, { merge: true });
                }
            } catch (error) {
                logger.error(`Unable to update member stats for memberId = ${ memberId }. ${ queryOptions?.transaction ? "Used transaction" : "Not using transaction." }`, error)
            }
        }
        return;
    }

    async setWordInsights(options: { memberId: string, wordCloud: InsightWord[], batch?: Batch }, queryOptions?: SaveOptions): Promise<void> {
        const { memberId, wordCloud } = options;
        const doc: DocumentReference = this.getCollectionRef().doc(memberId);
        const data: Partial<CactusMember> = {
            wordCloud: wordCloud
        };
        try {
            if (queryOptions?.transaction) {
                await queryOptions?.transaction.set(doc, data, { merge: true })
            } else if (options.batch) {
                options.batch.set(doc, data, { merge: true })
            } else {
                await doc.set(data, { merge: true });
            }
        } catch (error) {
            logger.error(`Unable to update member stats for memberId = ${ memberId }. ${ queryOptions?.transaction ? "Used transaction" : "Not using transaction." }`, error)
        }
        return;
    }

    async getByMailchimpMemberId(id?: string): Promise<CactusMember | undefined> {
        if (!id) {
            return;
        }

        const query = firestoreService.getCollectionRef(Collection.members).where(Field.mailchimpListMemberId, "==", id);
        const result = await firestoreService.executeQuery(query, CactusMember);
        if (result.size === 0) {
            return;
        }

        if (result.size > 1) {
            logger.warn("Found more than one CactusMember for mailchimp memberId", id);
        }

        const [member] = result.results;
        return member;
    }

    async getByMailchimpUniqueEmailId(id?: string): Promise<CactusMember | undefined> {
        if (!id) {
            return;
        }
        const query = firestoreService.getCollectionRef(Collection.members).where(Field.mailchimpListMemberUniqueEmailId, "==", id);
        const result = await firestoreService.executeQuery(query, CactusMember);
        if (result.size === 0) {
            return;
        }

        if (result.size > 1) {
            logger.warn("Found more than one CactusMember for mailchimp memberId", id);
        }

        const [member] = result.results;
        return member;
    }

    async getByMailchimpWebId(id?: string): Promise<CactusMember | undefined> {
        if (!id) {
            return;
        }
        const query = firestoreService.getCollectionRef(Collection.members).where(Field.mailchimpListMemberWebId, "==", id);
        const result = await firestoreService.executeQuery(query, CactusMember);
        if (result.size === 0) {
            return;
        }

        if (result.size > 1) {
            logger.warn("Found more than one CactusMember for mailchimp member web_id", id);
        }

        const [member] = result.results;
        return member;
    }

    async setEmail(memberId: string, email: string) {
        const ref = this.getCollectionRef().doc(memberId);
        try {
            await ref.update({ [CactusMember.Field.email]: email });
        } catch (error) {
            logger.error("Failed to set user email", error);
        }
    }

    async updateUnsubscribe(unsubscribeReport?: Partial<MemberUnsubscribeReport>): Promise<CactusMember | undefined> {
        if (!unsubscribeReport || !unsubscribeReport.email_address) {
            return undefined;
        }
        const email = unsubscribeReport.email_address;
        let cactusMember = await this.getMemberByEmail(email);

        if (cactusMember) {
            cactusMember.unsubscribedAt = getDateFromISOString(unsubscribeReport.timestamp);
            cactusMember.unsubscribeReason = unsubscribeReport.reason;
            cactusMember.unsubscribeCampaignId = unsubscribeReport.campaign_id;
            cactusMember = await this.save(cactusMember);
        }

        return cactusMember;
    }

    getNotificationStatusFromSubscriberStatus(status: ListMemberStatus): NotificationStatus {
        let notification = NotificationStatus.NOT_SET;

        switch (status) {
            case ListMemberStatus.subscribed:
                notification = NotificationStatus.ACTIVE;
                break;
            case ListMemberStatus.unsubscribed:
                notification = NotificationStatus.INACTIVE;
                break;
            case ListMemberStatus.cleaned:
                notification = NotificationStatus.INACTIVE;
                break;
            case ListMemberStatus.pending:
                notification = NotificationStatus.NOT_SET;
                break;
            default:
                logger.warn(`Unable to handle list member status ${ status }`);
        }
        return notification;
    }

    async updateFromMailchimpListMember(listMember: ListMember, unsubscribeReport: Partial<MemberUnsubscribeReport> | undefined = undefined): Promise<CactusMember | undefined> {
        let cactusMember = await this.getByMailchimpWebId(listMember.web_id);
        if (!cactusMember) {
            cactusMember = await this.getMemberByEmail(listMember.email_address);
        }

        if (!cactusMember) {
            cactusMember = new CactusMember();
            cactusMember.createdAt = new Date()
        } else {
            logger.log("Got cactus member", cactusMember.email);
        }

        if (listMember.unsubscribe_reason) {
            cactusMember.unsubscribeReason = listMember.unsubscribe_reason;
        }

        if (unsubscribeReport) {
            cactusMember.unsubscribedAt = getDateFromISOString(unsubscribeReport.timestamp);
            cactusMember.unsubscribeReason = unsubscribeReport.reason;
            cactusMember.unsubscribeCampaignId = unsubscribeReport.campaign_id;
        }


        cactusMember.notificationSettings.email = this.getNotificationStatusFromSubscriberStatus(listMember.status);

        cactusMember.mailchimpListMember = listMember;
        cactusMember.email = listMember.email_address || cactusMember.email;
        cactusMember.firstName = listMember.merge_fields.FNAME as string || cactusMember.firstName;
        cactusMember.lastName = listMember.merge_fields.LNAME as string || cactusMember.firstName;
        cactusMember.lastReplyAt = getDateFromISOString(listMember.merge_fields.LAST_REPLY as string) || cactusMember.lastReplyAt;
        cactusMember.lastSyncedAt = new Date();
        cactusMember.signupAt = getDateFromISOString(listMember.timestamp_signup);
        cactusMember.signupConfirmedAt = getDateFromISOString(listMember.timestamp_opt);

        if (!cactusMember.referredByEmail && listMember.merge_fields.REF_EMAIL) {
            cactusMember.referredByEmail = listMember.merge_fields.REF_EMAIL as string;
        }

        const premiumJournal = listMember.tags.find(tag => tag.name === TagName.JOURNAL_PREMIUM);
        if (premiumJournal) {
            cactusMember.journalStatus = JournalStatus.PREMIUM;
        } else {
            cactusMember.journalStatus = JournalStatus.NONE;
        }

        logger.log("Saving cactus member", cactusMember.email);

        cactusMember = await this.save(cactusMember);
        return cactusMember;
    }

    async getMemberByUserId(userId?: string, options?: GetOptions): Promise<CactusMember | undefined> {
        if (!userId) {
            return;
        }

        const query = this.getCollectionRef().where(Field.userId, "==", userId);
        return await firestoreService.getFirst(query, CactusMember, options);
    }

    async findCactusMember(options: { email?: string, userId?: string, cactusMemberId?: string }, getOptions?: GetOptions): Promise<CactusMember | undefined> {
        const { email, userId, cactusMemberId } = options;
        let member: CactusMember | undefined = undefined;
        if (cactusMemberId) {
            member = await this.getById(cactusMemberId, getOptions)
        }

        if (!member && userId) {
            member = await this.getMemberByUserId(userId, getOptions);
        }

        if (!member && email) {
            member = await this.getMemberByEmail(email, getOptions)
        }

        return member
    }

    async findAllMatchingAny(params: { userId?: string | null, email?: string | null }, options: GetOptions = DefaultGetOptions): Promise<CactusMember[]> {
        let { email } = params;
        const { userId } = params;
        if (!email && !userId) {
            return [];
        }
        email = email?.toLowerCase().trim();
        const members: CactusMember[] = [];

        if (!isBlank(email)) {
            const emailQuery = firestoreService.getCollectionRef(Collection.members).where(Field.email, "==", email);
            options.queryName = `AdminCactusMemberService.findAllMatchingAny(${ email })`;
            const result = await firestoreService.executeQuery(emailQuery, CactusMember, options);
            members.push(...result.results);
        }


        if (!isBlank(userId)) {
            const userIdQuery = firestoreService.getCollectionRef(Collection.members).where(Field.userId, "==", userId);
            options.queryName = `AdminCactusMemberService.findAllMatchingAny(${ userId }`;
            const result = await firestoreService.executeQuery(userIdQuery, CactusMember, options);
            members.push(...result.results);
        }

        return removeDuplicates(members);
    }

    async getMemberByEmail(emailInput?: string | null, options: GetOptions = DefaultGetOptions): Promise<CactusMember | undefined> {
        if (!emailInput) {
            return undefined;
        }
        const email = emailInput.toLowerCase().trim();
        const query = firestoreService.getCollectionRef(Collection.members).where(Field.email, "==", email);
        options.queryName = `AdminCactusMemberService.getMemberByEmail(${ email })`;
        const result = await firestoreService.executeQuery(query, CactusMember, options);

        if (result.error && options?.throwOnError) {
            const error = result.error instanceof Error ? result.error : new Error(`${ result.error }`);
            error.name = error.name || "getMemberByEmail failed";
            throw error;
        }

        if (result.size > 0) {
            const [member] = result.results;
            if (result.size > 1) {
                logger.warn("More than one member found for email", email);
            }
            return member;
        }

        return;
    }

    async updateLastReplyByEmail(email: string, lastReply: Date = new Date()): Promise<CactusMember | undefined> {
        try {
            const member = await this.getMemberByEmail(email);
            if (!member) {
                return
            }

            member.lastReplyAt = lastReply;
            await this.save(member);
            return member;
        } catch (error) {
            logger.error("Failed to update last reply for user email ", email);
            return undefined;
        }
    }

    async updateLastReplyByMemberId(memberId?: string, lastReply: Date = new Date()): Promise<void> {
        if (!memberId) {
            return;
        }
        try {
            const doc = this.getCollectionRef().doc(memberId);
            await doc.update({ [CactusMember.Field.lastReplyAt]: Timestamp.fromDate(lastReply) });
            return;
        } catch (error) {
            logger.error("Failed to update last reply for memberId ", memberId);
            return;
        }
    }


    async updateLastJournalByEmail(email: string, lastJournal: Date = new Date()): Promise<CactusMember | undefined> {
        const member = await this.getMemberByEmail(email);
        if (!member) {
            return
        }

        member.lastJournalEntryAt = lastJournal;
        await this.save(member);
        return member;
    }

    async getAllMembers(): Promise<CactusMember[]> {
        logger.warn("Warning, fetching all members could be expensive");
        const query = this.getCollectionRef();
        const results = await AdminFirestoreService.getSharedInstance().executeQuery(query, CactusMember);
        return results.results;
    }

    async getAllBatch(options: {
        batchSize?: number,
        pageDelay?: number,
        onData: (members: CactusMember[], batchNumber: number) => Promise<void>
    }) {
        try {
            logger.log("Getting batched result 1 for all members");
            const query = this.getCollectionRef();
            let batchNumber = 0;
            let results = await AdminFirestoreService.getSharedInstance().executeQuery(query, CactusMember, {
                pagination: {
                    limit: options.batchSize || DEFAULT_BATCH_SIZE,
                    orderBy: BaseModelField.createdAt,
                    sortDirection: QuerySortDirection.asc
                }
            });
            logger.log(`Fetched ${ results.size } members in batch ${ batchNumber }`);
            await options.onData(results.results, 0);
            while (results.results.length > 0 && results.lastCursor) {
                try {
                    batchNumber++;
                    results = await AdminFirestoreService.getSharedInstance().executeQuery(query, CactusMember, {
                        pagination: {
                            limit: options.batchSize || 100,
                            startAfter: results.lastCursor,
                            orderBy: BaseModelField.createdAt,
                            sortDirection: QuerySortDirection.asc
                        }
                    });
                    logger.log(`Fetched ${ results.size } members in batch ${ batchNumber }`);
                    await options.onData(results.results, batchNumber);
                    const delay = options.pageDelay;
                    if (delay && delay > 0) {
                        await new Promise(resolve => {
                            logger.info(`Waiting ${ options.pageDelay }ms before processing next page`);
                            setTimeout(() => {
                                resolve()
                            }, delay)
                        })
                    }
                } catch (batchError) {
                    logger.error("Failed to execute the batch", batchError);
                }
            }
        } catch (error) {
            logger.error("The pagination query failed to execute", error);
        }
    }

    async getMembersCreatedSince(date: Date = new Date()): Promise<CactusMember[]> {
        const ts = AdminFirestoreService.Timestamp.fromDate(getDateAtMidnightDenver(date));

        const query = this.getCollectionRef().where(BaseModelField.createdAt, ">=", ts);

        try {
            const results = await AdminFirestoreService.getSharedInstance().executeQuery(query, CactusMember);

            return results.results;
        } catch (error) {
            logger.error(error);
            return [];
        }
    }

    /**
     * Get members where the opt-out trial started after the provided Date.
     * This is typically used to look at members for the previous day in the Slack job.
     * @param {Date} date - the date to start the query.
     * @return {Promise<CactusMember[]>}
     */
    async getOptOutTrialStartedSince(date: Date): Promise<CactusMember[]> {
        const ts = AdminFirestoreService.Timestamp.fromDate(getDateAtMidnightDenver(date));
        const query = this.getCollectionRef().where(CactusMember.Field.subscriptionOptOutTrialStartedAt, ">=", ts);
        return (await firestoreService.executeQuery(query, CactusMember)).results;
    }

    /**
     * Get members where the cancellation.userInitiatedAt started after the provided Date.
     * This is typically used to look at members for the previous day in the Slack job.
     * @param {Date} date - the date to start the query.
     * @return {Promise<CactusMember[]>}
     */
    async getCancellationsInitiatedSince(date: Date): Promise<CactusMember[]> {
        const ts = AdminFirestoreService.Timestamp.fromDate(getDateAtMidnightDenver(date));
        const query = this.getCollectionRef().where(CactusMember.Field.subscriptionCancellationInitiatedAt, ">=", ts);
        return (await firestoreService.executeQuery(query, CactusMember)).results;
    }

    /**
     * Get members where their trial has ended and they converted to paid
     * @param {Date} date
     * @return {Promise<CactusMember[]>}
     */
    async getOptTrialsConvertedToPaidSince(date: Date): Promise<CactusMember[]> {
        const tomorrow = plusDays(1, date);
        const todayTs = AdminFirestoreService.Timestamp.fromDate(getDateAtMidnightDenver(date));
        const tomorrowTs = AdminFirestoreService.Timestamp.fromDate(getDateAtMidnightDenver(tomorrow))
        const query = this.getCollectionRef()
        .where(CactusMember.Field.subscriptionOptOutTrialEndsAt, ">=", todayTs)
        .where(CactusMember.Field.subscriptionOptOutTrialEndsAt, "<=", tomorrowTs)
        .where(CactusMember.Field.subscriptionTier, "==", SubscriptionTier.PLUS);
        return (await firestoreService.executeQuery(query, CactusMember)).results;
    }

    async getPromotionalOffersAppliedOn(date: Date): Promise<CactusMember[]> {
        const tomorrow = plusDays(1, date);
        const todayTs = AdminFirestoreService.Timestamp.fromDate(getDateAtMidnightDenver(date));
        const tomorrowTs = AdminFirestoreService.Timestamp.fromDate(getDateAtMidnightDenver(tomorrow))
        const query = this.getCollectionRef()
        .where(CactusMember.Field.currentOfferAppliedAt, ">=", todayTs)
        .where(CactusMember.Field.currentOfferAppliedAt, "<=", tomorrowTs)
        return (await firestoreService.executeQuery(query, CactusMember)).results;
    }

    async getPromotionalOffersRedeemedOn(date: Date): Promise<CactusMember[]> {
        const tomorrow = plusDays(1, date);
        const todayTs = AdminFirestoreService.Timestamp.fromDate(getDateAtMidnightDenver(date));
        const tomorrowTs = AdminFirestoreService.Timestamp.fromDate(getDateAtMidnightDenver(tomorrow))
        const query = this.getCollectionRef()
        .where(CactusMember.Field.currentOfferRedeemedAt, ">=", todayTs)
        .where(CactusMember.Field.currentOfferRedeemedAt, "<=", tomorrowTs)
        return (await firestoreService.executeQuery(query, CactusMember)).results;
    }

    async getMembersForUTCSendPromptTime(sendTime: PromptSendTime, options?: GetOptions): Promise<CactusMember[]> {
        const query = this.getCollectionRef().where(CactusMember.Field.promptSendTimeUTC_hour, "==", sendTime.hour)
        .where(CactusMember.Field.promptSendTimeUTC_minute, "==", sendTime.minute);

        const results = await firestoreService.executeQuery(query, CactusMember);
        return results.results;
    }

    async getMembersForUTCSendPromptTimeBatch(sendTime: PromptSendTime, options: GetBatchOptions<CactusMember>): Promise<void> {
        const query = this.getCollectionRef().where(CactusMember.Field.promptSendTimeUTC_hour, "==", sendTime.hour)
        .where(CactusMember.Field.promptSendTimeUTC_minute, "==", sendTime.minute);

        await firestoreService.executeBatchedQuery({
            query,
            type: CactusMember,
            onData: options.onData,
            batchSize: options?.batchSize,
            orderBy: BaseModelField.createdAt,
            sortDirection: QuerySortDirection.asc
        });
        return;
    }

    async getMembersWithReflectionCountGreaterThan(reflectionCount: number, options: GetBatchOptions<CactusMember>): Promise<void> {
        const query = this.getCollectionRef()

        await firestoreService.executeBatchedQuery({
            query,
            type: CactusMember,
            onData: options.onData,
            batchSize: options?.batchSize,
            orderBy: BaseModelField.createdAt,
            sortDirection: QuerySortDirection.asc
        });
        return;
    }

    async updateMemberSendPromptTime(member: CactusMember, options: { useDefault: boolean } = {
        useDefault: false,
    }): Promise<UpdateSendPromptUTCResult> {
        logger.log("Updating memberUTC Send Prompt Time for member", member.email, member.id);

        const { useDefault } = options;
        const beforeUTC = member.promptSendTimeUTC ? { ...member.promptSendTimeUTC } : undefined;
        const memberTimezone = getValidTimezoneName(member.timeZone);
        if (!memberTimezone) {
            logger.log("Member's converted local timezone is unknown. Skipping!");
            return { updated: false, promptSendTimeUTC: beforeUTC }
        }

        // the member has a default promptSendTimeUTC and a timeZone 
        // but *not* a local promptSendTime
        // we can set their local promptSendTime and return
        if (memberTimezone &&
        member.promptSendTimeUTC &&
        !member.promptSendTime) {

            const localPromptSendTime = member.getLocalPromptSendTimeFromUTC();
            logger.log("Member's local promptSendTime is not set but UTC is. Setting from UTC.");
            logger.log("Member's set timezone is: " + member.timeZone);
            logger.log("Member's converted valid timezone is: " + memberTimezone);
            logger.log("PromptSendTime calculated: ", JSON.stringify(localPromptSendTime));
            logger.log("Saving change...");
            await this.getCollectionRef().doc(member.id!).update({ [CactusMember.Field.promptSendTime]: localPromptSendTime });
            logger.log("Saved changes.");
            return { updated: true, promptSendTimeUTC: beforeUTC, promptSendTime: localPromptSendTime };
        }

        const afterUTC = getSendTimeUTC({
            forDate: new Date(),
            timeZone: memberTimezone,
            sendTime: member.promptSendTime
        });

        logger.log("beforeUTC", JSON.stringify(beforeUTC));
        logger.log("afterUTC", JSON.stringify(afterUTC));

        const denverUTCDefault = getSendTimeUTC({
            forDate: new Date(),
            timeZone: 'America/Denver',
            sendTime: DEFAULT_PROMPT_SEND_TIME,
        });

        const { minute: afterMin, hour: afterHour } = afterUTC || {};
        const { minute: beforeMinute, hour: beforeHour } = beforeUTC || {};

        if (afterUTC && (afterMin !== beforeMinute || afterHour !== beforeHour)) {
            logger.log("Member has changes, saving them");
            await this.getCollectionRef().doc(member.id!).update({ [CactusMember.Field.promptSendTimeUTC]: afterUTC });
            logger.log("saved changes.");
            return { updated: true, promptSendTimeUTC: afterUTC };
        } else if (useDefault && !afterUTC && denverUTCDefault) {
            logger.log("No sendPromptTime for UTC found. using the default value");
            await this.getCollectionRef().doc(member.id!).update({ [CactusMember.Field.promptSendTimeUTC]: denverUTCDefault });
            return { updated: true, promptSendTimeUTC: denverUTCDefault };
        } else if (useDefault && !denverUTCDefault) {
            logger.error("No default value was created.");
            return { updated: false, promptSendTimeUTC: beforeUTC }
        } else {
            logger.log("No changes, not saving");
            return { updated: false, promptSendTimeUTC: beforeUTC }
        }
    }

    /**
     * Save a timezone to a member. If no valid timezone can be parsed, the timezone will be saved as null
     * @param {CactusMember} member
     * @param {string | null} timeZone
     * @return {Promise<void>}
     */
    async saveTimeZone(member: CactusMember, timeZone?: string | null): Promise<CactusMember> {
        const validTimezoneOrNull = getValidTimezoneName(timeZone) || null;
        const memberId = member.id;
        if (!memberId) {
            logger.warn("No memberID found");
            return member;
        }

        await this.getCollectionRef().doc(memberId).update({ [CactusMember.Field.timeZone]: validTimezoneOrNull });
        member.timeZone = validTimezoneOrNull;
        return member;
    }

    async getMembersBatch(options: GetMembersBatchOptions): Promise<CactusMember[]> {
        // logger.info("Get members in batch with options", stringifyJSON(options, 2));

        //build up the query using the passed in where clauses
        let query: FirebaseFirestore.Query = firestoreService.getCollectionRef(Collection.members);
        options.where?.forEach(w => {
            const [field, op, value] = w;
            query = query.where(field, op, value);
        });

        //set the default offset to be the last cursor value
        let startAfter = options.lastCursor;

        //try to get the snapshot of the latest user, so that we aren't relying on the single value.
        //But, if this member no longer exists, we can still do the cursor based on the cursor value
        if (options.lastMemberId) {
            const memberSnapshot = await firestoreService.getCollectionRef(Collection.members).doc(options.lastMemberId).get();
            if (memberSnapshot) {
                startAfter = memberSnapshot
            }
        }

        //set up pagination
        options.pagination = {
            startAfter,
            limit: options.limit ?? 500,
            orderBy: options.orderBy,
            sortDirection: options.sortDirection,
        };

        const result = await firestoreService.executeQuery(query, CactusMember, options);
        return result.results;
    }

    async setCoreValues(memberId: string, values: CoreValue[]): Promise<void> {
        try {
            await this.getCollectionRef().doc(memberId).set({ [CactusMember.Field.coreValues]: values }, { merge: true });
        } catch (error) {
            logger.error(`Failed to update member's core values: memberId = ${ memberId }`)
        }
        return
    }

    /**
     * Set the Email notification prefernece for a member by email address. Only updates the member record
     * @param {string} email
     * @param {boolean} subscribed
     * @param {boolean} isAdminUnsubscribe - set to TRUE if the member's adminEmailUnsubscribe should get updated
     * @return {Promise<void>}
     */
    async setEmailNotificationPreference(email: string, subscribed: boolean, isAdminUnsubscribe: boolean = false): Promise<CactusMember | undefined> {
        const member = await this.getMemberByEmail(email);
        if (!member) {
            return;
        }

        member.notificationSettings.email = subscribed ? NotificationStatus.ACTIVE : NotificationStatus.INACTIVE;
        if (!subscribed && isAdminUnsubscribe) {
            member.adminEmailUnsubscribedAt = new Date();
        }
        logger.info("Setting member's email preference to ", member.notificationSettings.email);
        await this.save(member);
        return member;
    }

    async updateStatsOnReflectionResponse(memberId?: string): Promise<void> {
        if (!memberId) {
            return;
        }
        const { member } = await HoboCache.shared.getMemberById(memberId);
        if (!member) {
            return;
        }
        const timeZone = member.timeZone || undefined;
        const [reflectionStats, aggregatedWordCloud] = await Promise.all([
            AdminReflectionResponseService.getSharedInstance().calculateStatsForMember({
                memberId,
                timeZone
            }), AdminReflectionResponseService.getSharedInstance().aggregateWordInsightsForMember({
                memberId
            })
        ]);

        if (reflectionStats || aggregatedWordCloud) {
            await this.setStats({
                memberId,
                stats: reflectionStats,
                wordCloud: aggregatedWordCloud
            })
        }
    }
}
