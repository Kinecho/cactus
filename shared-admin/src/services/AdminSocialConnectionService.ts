import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import SocialConnection, {SocialConnectionFields} from "@shared/models/SocialConnection";
import {Collection} from "@shared/FirestoreBaseModels";

export default class AdminSocialConnectionService {
    protected static sharedInstance: AdminSocialConnectionService;

    public static initialize(): AdminSocialConnectionService {
        AdminSocialConnectionService.sharedInstance = new AdminSocialConnectionService();
        return AdminSocialConnectionService.sharedInstance;
    }

    public static getSharedInstance(): AdminSocialConnectionService {
        if (AdminSocialConnectionService.sharedInstance) {
            return AdminSocialConnectionService.sharedInstance;
        }
        console.error("no shared instance of AdminSocialConnectionService is yet available. Initializing it now (in the getter)");
        return AdminSocialConnectionService.initialize();

    }

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.socialConnections);
    }

    firestoreService: AdminFirestoreService;

    constructor() {
        this.firestoreService = AdminFirestoreService.getSharedInstance();
    }

    async getConnectionsForMember(memberId: string): Promise<SocialConnection[]> {
        const query = this.getCollectionRef().where(SocialConnectionFields.memberId, '==', memberId);
        const results = await this.firestoreService.executeQuery(query, SocialConnection);

        return results.results
    }
}