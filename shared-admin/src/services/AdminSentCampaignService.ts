import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import SentCampaign from "@shared/models/SentCampaign";
import {Collection} from "@shared/FirestoreBaseModels";

let firestoreService: AdminFirestoreService;

export default class AdminSentCampaignService {
    protected static sharedInstance: AdminSentCampaignService;

    static getSharedInstance(): AdminSentCampaignService {
        if (!AdminSentCampaignService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminSentCampaignService before using it");
        }
        return AdminSentCampaignService.sharedInstance;
    }

    getCollectionRef() {
        return firestoreService.getCollectionRef(Collection.sentCampaigns);
    }

    static initialize() {
        firestoreService = AdminFirestoreService.getSharedInstance();
        AdminSentCampaignService.sharedInstance = new AdminSentCampaignService();
    }

    async save(model: SentCampaign): Promise<SentCampaign> {
        return firestoreService.save(model);
    }

    async getByCampaignId(id?: string): Promise<SentCampaign | undefined> {
        if (!id) {
            return;
        }
        return await firestoreService.getById(id, SentCampaign);
    }
}