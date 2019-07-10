import FirestoreService, {Query} from "@web/services/FirestoreService";
import CactusMember, {Field} from "@shared/models/CactusMember";
import {Collection} from "@shared/FirestoreBaseModels";

export default class CactusMemberService {
    public static sharedInstance = new CactusMemberService();
    firestoreService = FirestoreService.sharedInstance;

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.members);
    }

    async executeQuery(query: Query) {
        return this.firestoreService.executeQuery(query, CactusMember);
    }

    async getFirst(query: Query) {
        return this.firestoreService.getFirst(query, CactusMember);
    }

    async save(model: CactusMember): Promise<CactusMember> {
        return this.firestoreService.save(model);
    }

    async getById(id: string): Promise<CactusMember | undefined> {
        return await this.firestoreService.getById(id, CactusMember);
    }

    async getByUserId(userId: string): Promise<CactusMember | undefined> {
        const query = this.getCollectionRef().where(Field.userId, "==", userId);
        return await this.getFirst(query);
    }
}



