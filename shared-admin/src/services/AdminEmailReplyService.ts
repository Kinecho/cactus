import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import {Collection} from "@shared/FirestoreBaseModels";

let firestoreService: AdminFirestoreService;

export default class AdminEmailReplyService {
    protected static sharedInstance: AdminEmailReplyService;

    static getSharedInstance(): AdminEmailReplyService {
        if (!AdminEmailReplyService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminEmailReplyService before using it");
        }
        return AdminEmailReplyService.sharedInstance;
    }

    getCollectionRef() {
        return firestoreService.getCollectionRef(Collection.emailReply)
    }

    static initialize() {
        firestoreService = AdminFirestoreService.getSharedInstance();
        AdminEmailReplyService.sharedInstance = new AdminEmailReplyService();
    }

    async deletePermanentlyByEmail(email: string): Promise<number> {
        const query = this.getCollectionRef().where("from.email", "==", email);
        let result = await firestoreService.deletePermanentlyForQuery(query);
        console.log(`deleted ${result} emailReply entries`);
        return result;
    }
}