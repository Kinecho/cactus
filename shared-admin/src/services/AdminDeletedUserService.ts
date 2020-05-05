import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import DeletedUser from "@shared/models/DeletedUser";
import { Collection } from "@shared/FirestoreBaseModels";
import { getDateAtMidnightDenver } from "@shared/util/DateUtil";

let firestoreService: AdminFirestoreService;

export default class AdminDeletedUserService {
    protected static sharedInstance: AdminDeletedUserService;

    static getSharedInstance(): AdminDeletedUserService {
        if (!AdminDeletedUserService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminDeletedUserService before using it");
        }
        return AdminDeletedUserService.sharedInstance;
    }

    static initialize() {
        firestoreService = AdminFirestoreService.getSharedInstance();
        AdminDeletedUserService.sharedInstance = new AdminDeletedUserService();
    }

    collectionRef() {
        return firestoreService.getCollectionRef(Collection.deletedUsers);
    }

    async save(model: DeletedUser): Promise<DeletedUser> {
        return firestoreService.save(model);
    }

    async getById(id: string): Promise<DeletedUser | undefined> {
        return await firestoreService.getById(id, DeletedUser);
    }

    async getAllSince(date: Date): Promise<DeletedUser[]> {
        const ts = AdminFirestoreService.Timestamp.fromDate(getDateAtMidnightDenver(date));
        const query = this.collectionRef().where(DeletedUser.Field.memberDeletedAt, ">=", ts);
        return (await firestoreService.executeQuery(query, DeletedUser)).results;
    }
}