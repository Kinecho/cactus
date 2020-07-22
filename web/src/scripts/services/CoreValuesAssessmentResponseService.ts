import FirestoreService, { ListenerUnsubscriber, Query } from "@web/services/FirestoreService";
import CoreValuesAssessmentResponse from "@shared/models/CoreValuesAssessmentResponse";
import { BaseModelField, Collection } from "@shared/FirestoreBaseModels";
import { DocObserverOptions } from "@shared/types/FirestoreTypes";

export default class CoreValuesAssessmentResponseService {
    public static sharedInstance = new CoreValuesAssessmentResponseService();
    firestoreService = FirestoreService.sharedInstance;

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.coreValuesAssessmentResponses)
    }

    async executeQuery(query: Query) {
        return this.firestoreService.executeQuery(query, CoreValuesAssessmentResponse);
    }

    async getFirst(query: Query) {
        return this.firestoreService.getFirst(query, CoreValuesAssessmentResponse);
    }

    async save(model: CoreValuesAssessmentResponse): Promise<CoreValuesAssessmentResponse | undefined> {
        return this.firestoreService.save(model);
    }

    async getById(id: string): Promise<CoreValuesAssessmentResponse | undefined> {
        return await this.firestoreService.getById(id, CoreValuesAssessmentResponse);
    }

    async getLatestForUser(memberId: string): Promise<CoreValuesAssessmentResponse | undefined> {
        const query = this.getCollectionRef().where(CoreValuesAssessmentResponse.Fields.memberId, "==", memberId)
        .where(CoreValuesAssessmentResponse.Fields.completed, "==", true)
        .orderBy(BaseModelField.createdAt, "desc");
        return this.getFirst(query);
    }

    observeById(id: string, options: DocObserverOptions<CoreValuesAssessmentResponse>): ListenerUnsubscriber {
        return this.firestoreService.observeById(id, CoreValuesAssessmentResponse, options);
    }

}



