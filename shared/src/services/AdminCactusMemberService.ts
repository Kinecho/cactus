import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import CactusMember, {Field, JournalStatus} from "@shared/models/CactusMember";
import {Collection} from "@shared/FirestoreBaseModels";
import {getDateFromISOString} from "@shared/util/DateUtil";
import {ListMember, TagName} from "@shared/mailchimp/models/MailchimpTypes";

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

    async save(model: CactusMember): Promise<CactusMember> {
        return firestoreService.save(model);
    }

    async getById(id: string): Promise<CactusMember | undefined> {
        return await firestoreService.getById(id, CactusMember);
    }

    async delete(id: string): Promise<CactusMember | undefined> {
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
            console.warn("Found more than one CactusMember for mailchimp memberId", id);
        }

        const [member] = result.results;
        return member;
    }

    async updateFromMailchimpListMember(listMember: ListMember): Promise<CactusMember | undefined> {
        let cactusMember = await this.getByMailchimpWebId(listMember.web_id);
        if (cactusMember) {
            console.log("Got cactus member", cactusMember.email);
        } else {
            cactusMember = new CactusMember();
            cactusMember.createdAt = new Date()
        }

        cactusMember.mailchimpListMember = listMember;
        cactusMember.email = listMember.email_address || cactusMember.email;
        cactusMember.firstName = listMember.merge_fields.FNAME as string || cactusMember.firstName;
        cactusMember.lastName = listMember.merge_fields.LNAME as string || cactusMember.firstName;
        cactusMember.lastReplyAt = getDateFromISOString(listMember.merge_fields.LAST_REPLY as string) || cactusMember.lastReplyAt;
        cactusMember.lastSyncedAt = new Date();
        cactusMember.signupAt = getDateFromISOString(listMember.timestamp_signup);
        cactusMember.signupConfirmedAt = getDateFromISOString(listMember.timestamp_opt);

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

    async getMemberByEmail(emailInput: string): Promise<CactusMember | undefined> {
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
}