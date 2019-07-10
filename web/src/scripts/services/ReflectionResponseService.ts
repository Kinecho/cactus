import FirestoreService from "@web/services/FirestoreService";
import ReflectionResponse, {ReflectionResponseField} from "@shared/models/ReflectionResponse";
import {Collection} from "@shared/FirestoreBaseModels";


export default class ReflectionResponseService {
    public static sharedInstance = new ReflectionResponseService();
    firestoreService = FirestoreService.sharedInstance;

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.reflectionResponses)
    }

    async save(model: ReflectionResponse): Promise<ReflectionResponse> {
        return this.firestoreService.save(model);
    }

    async getForMailchimpMemberId(memberId: string): Promise<ReflectionResponse[]> {
        const query = this.getCollectionRef().where(ReflectionResponseField.mailchimpMemberId, "==", memberId);
        try {
            const results = await this.firestoreService.executeQuery(query, ReflectionResponse);
            return results.results;
        } catch (error) {
            console.error("Failed to fetch reflection responses", error);
            return [];
        }
    }

    async getById(id: string): Promise<ReflectionResponse | undefined> {
        return await this.firestoreService.getById(id, ReflectionResponse);
    }

}