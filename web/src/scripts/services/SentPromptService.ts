import FirestoreService, {ListenerUnsubscriber, Query, QueryObserverOptions} from "@web/services/FirestoreService";
import SentPrompt from "@shared/models/SentPrompt";
import {Collection} from "@shared/FirestoreBaseModels";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";

export default class SentPromptService {
    public static sharedInstance = new SentPromptService();
    firestoreService = FirestoreService.sharedInstance;

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.sentPrompts)
    }

    async executeQuery(query: Query) {
        return this.firestoreService.executeQuery(query, SentPrompt);
    }

    async getFirst(query: Query) {
        return this.firestoreService.getFirst(query, SentPrompt);
    }

    async save(model: SentPrompt): Promise<SentPrompt> {
        return this.firestoreService.save(model);
    }

    async getById(id: string): Promise<SentPrompt | undefined> {
        return await this.firestoreService.getById(id, SentPrompt);
    }

    observeForCactusMemberId(memberId: string, options: QueryObserverOptions<SentPrompt>): ListenerUnsubscriber {
        const query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", memberId)
            .orderBy(SentPrompt.Fields.firstSentAt, QuerySortDirection.desc);

        options.queryName = "observeSentPromptsForCactusMemberId=" + memberId;
        return this.firestoreService.observeQuery(query, SentPrompt, options);
    }

}



