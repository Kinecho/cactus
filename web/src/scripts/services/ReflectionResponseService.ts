import FirestoreService, {ListenerUnsubscriber, QueryObserverOptions} from "@web/services/FirestoreService";
import ReflectionResponse, {ReflectionResponseField} from "@shared/models/ReflectionResponse";
import {BaseModelField, Collection} from "@shared/FirestoreBaseModels";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";


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
        const query = this.getCollectionRef().where(ReflectionResponseField.mailchimpMemberId, "==", memberId)
            .orderBy(BaseModelField.createdAt, QuerySortDirection.desc);
        try {
            const results = await this.firestoreService.executeQuery(query, ReflectionResponse);
            return results.results;
        } catch (error) {
            console.error("Failed to fetch reflection responses", error);
            return [];
        }
    }

    observeForMailchimpMemberId(memberId: string, options: QueryObserverOptions<ReflectionResponse>): ListenerUnsubscriber {
        const query = this.getCollectionRef().where(ReflectionResponseField.mailchimpMemberId, "==", memberId)
            .orderBy(BaseModelField.createdAt, QuerySortDirection.desc);
        return this.firestoreService.observeQuery(query, ReflectionResponse, options);

    }

    async getById(id: string): Promise<ReflectionResponse | undefined> {
        return await this.firestoreService.getById(id, ReflectionResponse);
    }

    async delete(response: ReflectionResponse): Promise<ReflectionResponse | undefined> {
        if (!response.id) {
            return;
        }
        return this.firestoreService.delete(response.id, ReflectionResponse);
    }

}