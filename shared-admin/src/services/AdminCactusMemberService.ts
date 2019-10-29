import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import CactusMember, {Field, JournalStatus, NotificationStatus} from "@shared/models/CactusMember";
import {BaseModelField, Collection} from "@shared/FirestoreBaseModels";
import {getDateAtMidnightDenver, getDateFromISOString} from "@shared/util/DateUtil";
import {ListMember, ListMemberStatus, MemberUnsubscribeReport, TagName} from "@shared/mailchimp/models/MailchimpTypes";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";

let firestoreService: AdminFirestoreService;

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

    getCollectionRef() {
        return AdminFirestoreService.getSharedInstance().getCollectionRef(Collection.members);
    }

    async save(model: CactusMember): Promise<CactusMember> {
        return firestoreService.save(model);
    }

    async getById(id: string): Promise<CactusMember | undefined> {
        return await firestoreService.getById(id, CactusMember);
    }

    async delete(id?: string): Promise<CactusMember | undefined> {
        if (!id) {
            return undefined
        }
        return firestoreService.delete(id, CactusMember);
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

    async getMemberByUserId(userId?: string): Promise<CactusMember | undefined> {
        if (!userId) {
            return;
        }

        const query = this.getCollectionRef().where(Field.userId, "==", userId);
        return await firestoreService.getFirst(query, CactusMember);
    }

    async getMemberByEmail(emailInput?: string): Promise<CactusMember | undefined> {
        if (!emailInput) {
            return undefined;
        }
        const email = emailInput.toLowerCase().trim();
        const query = firestoreService.getCollectionRef(Collection.members).where(Field.email, "==", email);
        const result = await firestoreService.executeQuery(query, CactusMember);
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
        onData: (members: CactusMember[]) => Promise<void>
    }) {
        console.log("Getting batched result 1 for all members");
        const query = this.getCollectionRef();
        let batchNumber = 0;
        let results = await AdminFirestoreService.getSharedInstance().executeQuery(query, CactusMember, {
            pagination: {
                limit: options.batchSize || 100,
                orderBy: BaseModelField.createdAt,
                sortDirection: QuerySortDirection.asc
            }
        });
        console.log(`Fetched ${results.size} members in batch ${batchNumber}`);
        await options.onData(results.results);
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
            await options.onData(results.results)
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
}