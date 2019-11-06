import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import SocialInvite from "@shared/models/SocialInvite";
import {Collection} from "@shared/FirestoreBaseModels";
import CactusMember from "@shared/models/CactusMember";

let firestoreService: AdminFirestoreService;

export default class AdminSocialInviteService {
    protected static sharedInstance: AdminSocialInviteService;

    static getSharedInstance() {
        if (AdminSocialInviteService.sharedInstance) {
            return AdminSocialInviteService.sharedInstance;
        }
        throw new Error("You must initialize AdminSocialInviteService service before calling getSharedInstance()");
    }

    getCollectionRef() {
        return firestoreService.getCollectionRef(Collection.socialInvites);
    }

    static initialize() {
        firestoreService = AdminFirestoreService.getSharedInstance();
        AdminSocialInviteService.sharedInstance = new AdminSocialInviteService();
    }

    async save(model: SocialInvite): Promise<SocialInvite> {
        return firestoreService.save(model);
    }

    async getByInviteId(id?: string): Promise<SocialInvite | undefined> {
        if (!id) {
            return;
        }
        return await firestoreService.getById(id, SocialInvite);
    }

    async updateMemberJoined(member: CactusMember): Promise<SocialInvite | undefined> {
        if (member.signupQueryParams.inviteId) {
            const socialInvite = await firestoreService.getById(member.signupQueryParams.inviteId, SocialInvite);
            if (socialInvite && member) {
                socialInvite.recipientMemberId = member.id;
                return firestoreService.save(socialInvite);  
            }
        }

        return;
    }
}