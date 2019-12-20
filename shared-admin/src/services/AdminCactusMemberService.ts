import AdminFirestoreService, {
    CollectionReference, DefaultGetOptions,
    GetOptions,
    SaveOptions
} from "@admin/services/AdminFirestoreService";
import CactusMember, {
    DEFAULT_PROMPT_SEND_TIME,
    Field,
    JournalStatus,
    NotificationStatus,
    PromptSendTime,
    ReflectionStats
} from "@shared/models/CactusMember";
import {BaseModelField, Collection} from "@shared/FirestoreBaseModels";
import {getDateAtMidnightDenver, getDateFromISOString, getSendTimeUTC} from "@shared/util/DateUtil";
import {ListMember, ListMemberStatus, MemberUnsubscribeReport, TagName} from "@shared/mailchimp/models/MailchimpTypes";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";
import * as admin from "firebase-admin";
import DocumentReference = admin.firestore.DocumentReference;

let firestoreService: AdminFirestoreService;
const DEFAULT_BATCH_SIZE = 500;

export interface UpdateSendPromptUTCResult {
    updated: boolean,
    promptSendTimeUTC?: PromptSendTime
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

    async save(model: CactusMember, options?: SaveOptions): Promise<CactusMember> {
        return firestoreService.save(model, options);
    }

    async getById(id: string, options?: GetOptions): Promise<CactusMember | undefined> {
        return await firestoreService.getById(id, CactusMember, options);
    }

    async delete(id?: string): Promise<CactusMember | undefined> {
        if (!id) {
            return undefined
        }
        return firestoreService.delete(id, CactusMember);
    }

    async setReflectionStats(options: { memberId: string, stats: ReflectionStats }, queryOptions?: SaveOptions): Promise<void> {
        const {memberId, stats} = options;
        const doc: DocumentReference = this.getCollectionRef().doc(memberId);
        const data: Partial<CactusMember> = {
            stats: {
                reflections: stats
            }
        };

        if (queryOptions?.transaction) {
            await queryOptions?.transaction.set(doc, data, {merge: true})
        } else {
            await doc.set(data, {merge: true});
        }
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
            console.warn("Found more than one CactusMember for mailchimp memberId", id);
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
            console.warn("Found more than one CactusMember for mailchimp memberId", id);
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
            console.warn("Found more than one CactusMember for mailchimp member web_id", id);
        }

        const [member] = result.results;
        return member;
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
                console.warn(`Unable to handle list member status ${status}`);
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
            console.log("Got cactus member", cactusMember.email);
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

        console.log("Saving cactus member", cactusMember.email);

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
        const {email, userId, cactusMemberId} = options;
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

    async getMemberByEmail(emailInput?: string | null, options: GetOptions = DefaultGetOptions): Promise<CactusMember | undefined> | never {
        if (!emailInput) {
            return undefined;
        }
        const email = emailInput.toLowerCase().trim();
        const query = firestoreService.getCollectionRef(Collection.members).where(Field.email, "==", email);
        options.queryName = `AdminCactusMemberService.getMemberByEmail(${email})`;
        const result = await firestoreService.executeQuery(query, CactusMember, options);

        if (result.error && options?.throwOnError) {
            const error = result.error instanceof Error ? result.error : new Error(`${result.error}`);
            error.name = error.name || "getMemberByEmail failed";
            throw error;
        }

        if (result.size > 0) {
            const [member] = result.results;
            if (result.size > 1) {
                console.warn("More than one member found for email", email);
            }
            return member;
        }

        return;
    }

    async updateLastReplyByEmail(email: string, lastReply: Date = new Date()): Promise<CactusMember | undefined> {
        const member = await this.getMemberByEmail(email);
        if (!member) {
            return
        }

        member.lastReplyAt = lastReply;
        await this.save(member);
        return member;
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
        console.warn("Warning, fetching all members could be expensive");
        const query = this.getCollectionRef();
        const results = await AdminFirestoreService.getSharedInstance().executeQuery(query, CactusMember);
        return results.results;
    }

    async getAllBatch(options: {
        batchSize?: number,
        onData: (members: CactusMember[], batchNumber: number) => Promise<void>
    }) {
        console.log("Getting batched result 1 for all members");
        const query = this.getCollectionRef();
        let batchNumber = 0;
        let results = await AdminFirestoreService.getSharedInstance().executeQuery(query, CactusMember, {
            pagination: {
                limit: options.batchSize || DEFAULT_BATCH_SIZE,
                orderBy: BaseModelField.createdAt,
                sortDirection: QuerySortDirection.asc
            }
        });
        console.log(`Fetched ${results.size} members in batch ${batchNumber}`);
        await options.onData(results.results, 0);
        while (results.results.length > 0 && results.lastCursor) {
            batchNumber++;
            results = await AdminFirestoreService.getSharedInstance().executeQuery(query, CactusMember, {
                pagination: {
                    limit: options.batchSize || 100,
                    startAfter: results.lastCursor,
                    orderBy: BaseModelField.createdAt,
                    sortDirection: QuerySortDirection.asc
                }
            });
            console.log(`Fetched ${results.size} members in batch ${batchNumber}`);
            await options.onData(results.results, batchNumber)
        }
    }

    async getMembersCreatedSince(date: Date = new Date()): Promise<CactusMember[]> {
        const ts = AdminFirestoreService.Timestamp.fromDate(getDateAtMidnightDenver(date));

        const query = this.getCollectionRef().where(BaseModelField.createdAt, ">=", ts);

        try {
            const results = await AdminFirestoreService.getSharedInstance().executeQuery(query, CactusMember);

            return results.results;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    async getMembersUnsubscribedSince(date: Date = new Date()): Promise<CactusMember[]> {
        const ts = AdminFirestoreService.Timestamp.fromDate(getDateAtMidnightDenver(date));

        const query = this.getCollectionRef().where(CactusMember.Field.unsubscribedAt, ">=", ts);

        try {
            const results = await AdminFirestoreService.getSharedInstance().executeQuery(query, CactusMember);

            return results.results;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    async getMembersForUTCSendPromptTime(sendTime: PromptSendTime, options?: GetOptions): Promise<CactusMember[]> {
        const query = this.getCollectionRef().where(CactusMember.Field.promptSendTimeUTC_hour, "==", sendTime.hour)
            .where(CactusMember.Field.promptSendTimeUTC_minute, "==", sendTime.minute);

        const results = await firestoreService.executeQuery(query, CactusMember);
        return results.results;
    }

    async updateMemberUTCSendPromptTime(member: CactusMember, options: { useDefault: boolean } = {
        useDefault: false,
    }): Promise<UpdateSendPromptUTCResult> {
        const {useDefault, forceUpdate} = options;
        const beforeUTC = member.promptSendTimeUTC ? {...member.promptSendTimeUTC} : undefined;
        const afterUTC = getSendTimeUTC({
            forDate: new Date(),
            timeZone: member.timeZone,
            sendTime: member.promptSendTime
        });

        console.log("before", JSON.stringify(beforeUTC));
        console.log("afterUTC", JSON.stringify(afterUTC));

        const denverUTCDefault = getSendTimeUTC({
            forDate: new Date(),
            timeZone: 'America/Denver',
            sendTime: DEFAULT_PROMPT_SEND_TIME,
        });

        const {minute: afterMin, hour: afterHour} = afterUTC || {};
        const {minute: beforeMinute, hour: beforeHour} = beforeUTC || {};

        if (afterUTC && afterMin !== beforeMinute && afterHour !== beforeHour) {
            console.log("Member has changes, saving them");
            await this.getCollectionRef().doc(member.id!).update({[CactusMember.Field.promptSendTimeUTC]: afterUTC});
            console.log("saved changes.");
            return {updated: true, promptSendTimeUTC: afterUTC};
        } else if (useDefault && !afterUTC && denverUTCDefault) {
            console.log("No sendPromptTime for UTC found. using the default value");
            await this.getCollectionRef().doc(member.id!).update({[CactusMember.Field.promptSendTimeUTC]: denverUTCDefault});
            return {updated: true, promptSendTimeUTC: denverUTCDefault};
        } else if (useDefault && !denverUTCDefault) {
            console.error("No default value was created.")
        } else {
            console.log("No changes, not saving");
            return {updated: false, promptSendTimeUTC: beforeUTC}
        }
    }
}