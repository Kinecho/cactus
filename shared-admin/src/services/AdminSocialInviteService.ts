import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import SocialInvite from "@shared/models/SocialInvite";
import {Collection} from "@shared/FirestoreBaseModels";

let firestoreService: AdminFirestoreService;

export default class AdminSocialInviteService {
    protected static sharedInstance: AdminSocialInviteService;

    static getSharedInstance(): AdminSocialInviteService {
        if (!AdminSocialInviteService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminSocialInviteService before using it");
        }
        return AdminSocialInviteService.sharedInstance;
    }

    getCollectionRef() {
        return firestoreService.getCollectionRef(Collection.invites);
    }

    static initialize() {
        firestoreService = AdminSocialInviteService.getSharedInstance();
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
}