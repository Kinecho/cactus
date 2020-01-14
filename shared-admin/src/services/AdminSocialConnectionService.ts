import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import SocialConnection, {SocialConnectionFields} from "@shared/models/SocialConnection";
import {Collection} from "@shared/FirestoreBaseModels";
import Logger from "@shared/Logger";
const logger = new Logger("AdminSocialConnectionService");
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
        logger.error("no shared instance of AdminSocialConnectionService is yet available. Initializing it now (in the getter)");
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
        try {
            const query = this.getCollectionRef().where(SocialConnectionFields.memberId, '==', memberId);
            const results = await this.firestoreService.executeQuery(query, SocialConnection);
            return results.results
        } catch (error) {
            logger.error("Failed to fetch social connections for member", memberId);
            return [];
        }
    }

    async deleteConnectionsPermanentlyForMember(memberId: string): Promise<number> {
        try {
            const query = this.getCollectionRef().where(SocialConnectionFields.memberId, "==", memberId)
            return await this.firestoreService.deletePermanentlyForQuery(query)
        } catch (error) {
            logger.error("Failed to delete admin connections", error);
            return 0;
        }
    }
}