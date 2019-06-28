import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import CactusMember, {Field, JournalStatus} from "@shared/models/CactusMember";
import {Collection} from "@shared/FirestoreBaseModels";
import ListMember, {TagName} from "@shared/mailchimp/models/ListMember";
import {getDateFromISOString} from "@shared/util/DateUtil";

let firestoreService:AdminFirestoreService;

export default class AdminCactusMemberService {
    protected static sharedInstance:AdminCactusMemberService;

    static getSharedInstance():AdminCactusMemberService {
        if (!AdminCactusMemberService.sharedInstance){
            throw new Error("No shared instance available. Ensure you initialize AdminCactusMemberService before using it");
        }
        return AdminCactusMemberService.sharedInstance;
    }

    static initialize(){
        firestoreService = AdminFirestoreService.getSharedInstance();
        AdminCactusMemberService.sharedInstance = new AdminCactusMemberService();
    }

    async save(model:CactusMember):Promise<CactusMember> {
        return firestoreService.save(model);
    }

    async getById(id:string):Promise<CactusMember|undefined>{
        return await firestoreService.getById(id, CactusMember);
    }

    async getByMailchimpMemberId(id?:string): Promise<CactusMember|undefined> {
        if (!id){
            return;
        }

        const query = firestoreService.getCollectionRef(Collection.members).where(Field.mailchimpListMemberId, "==", id);
        const result = await firestoreService.executeQuery(query, CactusMember);
        if (result.size === 0){
            return;
        }

        if (result.size > 1){
            console.warn("Found more than one CactusMember for mailchimp memberId", id);
        }

        const [member] = result.results;
        return member;
    }

    async getByMailchimpUniqueEmailId(id?:string): Promise<CactusMember|undefined> {
        if (!id){
            return;
        }
        const query = firestoreService.getCollectionRef(Collection.members).where(Field.mailchimpListMemberUniqueEmailId, "==", id);
        const result = await firestoreService.executeQuery(query, CactusMember);
        if (result.size === 0){
            return;
        }

        if (result.size > 1){
            console.warn("Found more than one CactusMember for mailchimp memberId", id);
        }

        const [member] = result.results;
        return member;
    }

    async getByMailchimpWebId(id?:string): Promise<CactusMember|undefined> {
        if (!id){
            return;
        }
        const query = firestoreService.getCollectionRef(Collection.members).where(Field.mailchimpListMemberWebId, "==", id);
        const result = await firestoreService.executeQuery(query, CactusMember);
        if (result.size === 0){
            return;
        }

        if (result.size > 1){
            console.warn("Found more than one CactusMember for mailchimp memberId", id);
        }

        const [member] = result.results;
        return member;
    }


    async updateFromMailchimpListMember(listMember:ListMember):Promise<CactusMember|undefined> {




        let cactusMember = await this.getByMailchimpWebId(listMember.web_id);
        if (cactusMember){
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


        const premiumJournal = listMember.tags.find(tag => tag.name === TagName.JOURNAL_PREMIUM);
        if (premiumJournal){
            cactusMember.journalStatus = JournalStatus.PREMIUM;
        } else {
            cactusMember.journalStatus = JournalStatus.NONE;
        }


        console.log("Saving cactus member", cactusMember.email);

        cactusMember = await this.save(cactusMember);
        return cactusMember;
    }
}