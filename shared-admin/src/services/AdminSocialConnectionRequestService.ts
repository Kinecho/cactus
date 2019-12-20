import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import SocialConnectionRequest, {SocialConnectionRequestFields} from "@shared/models/SocialConnectionRequest";
import {Collection} from "@shared/FirestoreBaseModels";

let firestoreService: AdminFirestoreService;

export default class AdminSocialConnectionRequestService {
    protected static sharedInstance: AdminSocialConnectionRequestService;

    static getSharedInstance(): AdminSocialConnectionRequestService {
        if (!AdminSocialConnectionRequestService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminSocialConnectionRequestService before using it");
        }
        return AdminSocialConnectionRequestService.sharedInstance;
    }

    static initialize() {
        firestoreService = AdminFirestoreService.getSharedInstance();
        AdminSocialConnectionRequestService.sharedInstance = new AdminSocialConnectionRequestService();
    }

    getCollectionRef() {
        return firestoreService.getCollectionRef(Collection.socialConnectionRequests)
    }

    async save(model: SocialConnectionRequest): Promise<SocialConnectionRequest> {
        return firestoreService.save(model);
    }

    async getById(id: string): Promise<SocialConnectionRequest | undefined> {
        return await firestoreService.getById(id, SocialConnectionRequest);
    }

    async deleteConnectionRequestsPermanentlyForMember(memberId: string): Promise<number> {
        try {
            const memberQuery = this.getCollectionRef().where(SocialConnectionRequestFields.memberId, "==", memberId);
            const memberTotal = await firestoreService.deletePermanentlyForQuery(memberQuery);

            const friendQuery = this.getCollectionRef().where(SocialConnectionRequestFields.friendMemberId, "==", memberId);
            const friendTotal = await firestoreService.deletePermanentlyForQuery(friendQuery);

            return memberTotal + friendTotal;
        } catch (error) {
            console.error("Failed to delete admin connections", error);
            return 0;
        }
    }
}