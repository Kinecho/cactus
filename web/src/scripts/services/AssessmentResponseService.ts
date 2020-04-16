import FirestoreService, { ListenerUnsubscriber, Query } from "@web/services/FirestoreService";
import CoreValuesAssessmentResponse from "@shared/models/CoreValuesAssessmentResponse";
import {Collection} from "@shared/FirestoreBaseModels";
import { DocObserverOptions } from "@shared/types/FirestoreTypes";

export default class AssessmentResponseService {
    public static sharedInstance = new AssessmentResponseService();
    firestoreService = FirestoreService.sharedInstance;

    getCollectionRef(){
        return this.firestoreService.getCollectionRef(Collection.coreValuesAssessmentResponses)
    }

    async executeQuery(query: Query) {
        return this.firestoreService.executeQuery(query, CoreValuesAssessmentResponse);
    }

    async getFirst(query: Query) {
        return this.firestoreService.getFirst(query, CoreValuesAssessmentResponse);
    }

    async save(model:CoreValuesAssessmentResponse):Promise<CoreValuesAssessmentResponse|undefined> {
        return this.firestoreService.save(model);
    }

    async getById(id:string):Promise<CoreValuesAssessmentResponse|undefined>{
        return await this.firestoreService.getById(id, CoreValuesAssessmentResponse);
    }

    observeById(id: string, options: DocObserverOptions<CoreValuesAssessmentResponse>): ListenerUnsubscriber {
        return this.firestoreService.observeById(id, CoreValuesAssessmentResponse, options);
    }

}



