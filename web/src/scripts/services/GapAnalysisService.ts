import FirestoreService, { Query } from "@web/services/FirestoreService";
import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
import { BaseModelField, Collection } from "@shared/FirestoreBaseModels";

export default class GapAnalysisService {
    public static sharedInstance = new GapAnalysisService();
    firestoreService = FirestoreService.sharedInstance;

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.gapAnalysisAssessmentResults)
    }

    async executeQuery(query: Query) {
        return this.firestoreService.executeQuery(query, GapAnalysisAssessmentResult);
    }

    async getFirst(query: Query) {
        return this.firestoreService.getFirst(query, GapAnalysisAssessmentResult);
    }

    async save(model: GapAnalysisAssessmentResult): Promise<GapAnalysisAssessmentResult | undefined> {
        return this.firestoreService.save(model);
    }

    async getById(id: string): Promise<GapAnalysisAssessmentResult | undefined> {
        return await this.firestoreService.getById(id, GapAnalysisAssessmentResult);
    }

    async getLatestForMember(memberId: string, onlyCompleted: boolean = true) {
        let query = this.getCollectionRef().where(GapAnalysisAssessmentResult.Fields.memberId, "==", memberId);
        if (onlyCompleted) {
            query = query.where(GapAnalysisAssessmentResult.Fields.completed, "==", true);
        }

        query = query.orderBy(BaseModelField.updatedAt, "desc");
        return this.getFirst(query);
    }

    createDocId(): string {
        return this.getCollectionRef().doc().id
    }

}



