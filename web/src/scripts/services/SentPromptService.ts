import FirestoreService, {
    ListenerUnsubscriber, PageListenerResult,
    PageResult,
    Query,
    QueryCursor,
    QueryObserverOptions
} from "@web/services/FirestoreService";
import SentPrompt from "@shared/models/SentPrompt";
import {Collection} from "@shared/FirestoreBaseModels";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";
import CactusMemberService from "@web/services/CactusMemberService";
import {convertDateToTimestamp, toTimestamp} from "@shared/util/FirestoreUtil";

export interface SentPromptPageOptions {
    memberId: string,
    beforeOrEqualTo?: Date,
    limit?: number,
    lastResult?: PageResult<SentPrompt>,
    onData: (pageResult: PageResult<SentPrompt>) => void
}

export interface SentPromptPageListenerOptions {
    memberId: string,
    beforeOrEqualTo?: Date,
    limit?: number,
    lastResult?: PageResult<SentPrompt>,
    onData: (pageResult: PageListenerResult<SentPrompt>) => void
}

export interface FutureSentPromptPageListenerOptions {
    memberId: string,
    since: Date,
    limit?: number,
    lastResult?: PageResult<SentPrompt>,
    onData: (pageResult: PageListenerResult<SentPrompt>) => void
}

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

    async save(model: SentPrompt): Promise<SentPrompt | undefined> {
        return this.firestoreService.save(model);
    }

    async getById(id: string): Promise<SentPrompt | undefined> {
        try {
            return await this.firestoreService.getById(id, SentPrompt);
        } catch (e) {
            console.error("Failed to get sent prompt by id", e);
        }

    }

    async delete(id: string): Promise<SentPrompt | undefined> {
        return await this.firestoreService.delete(id, SentPrompt);
    }

    async getSentPrompt(promptId: string): Promise<SentPrompt | undefined> {
        const member = CactusMemberService.sharedInstance.getCurrentCactusMember();
        if (!member) {
            console.warn("Unable to get current member. Can not delete the sentQuestion");
            return;
        }

        try {
            const query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", member.id)
                .where(SentPrompt.Fields.promptId, "==", promptId);
            return this.firestoreService.getFirst(query, SentPrompt);
        } catch (e) {
            console.error("failed to get sent prompt by promptId", e);
        }

    }

    async deleteForPromptId(promptId: string): Promise<SentPrompt | undefined> {
        const sentPrompt = await this.getSentPrompt(promptId);
        if (sentPrompt && sentPrompt.id) {
            try {
                return this.delete(sentPrompt.id);
            } catch (e) {
                console.error(`Failed to delete prompt for promptId=${promptId} and sentPromptId=${sentPrompt.id}`)
            }

        }
    }

    observeFuturePrompts(options: FutureSentPromptPageListenerOptions): ListenerUnsubscriber {
        const {memberId, since, lastResult, limit, onData} = options;

        const query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", memberId)
            .orderBy(SentPrompt.Fields.firstSentAt, QuerySortDirection.desc)
            .where(SentPrompt.Fields.firstSentAt, ">", toTimestamp(since));



        return this.firestoreService.observePaginated(query, {
            limit: limit,
            onData,
            lastResult,
        }, SentPrompt)

    }

    observePage(options: SentPromptPageListenerOptions): ListenerUnsubscriber {
        const {memberId, beforeOrEqualTo, lastResult, limit, onData} = options;

        let query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", memberId)
            .orderBy(SentPrompt.Fields.firstSentAt, QuerySortDirection.desc);

        if (beforeOrEqualTo) {
            const beforeTimestamp = toTimestamp(beforeOrEqualTo);
            console.log("beforeOrEqualTo Timestamp", beforeTimestamp);
            query = query.where(SentPrompt.Fields.firstSentAt, "<=", beforeOrEqualTo)
        }

        return this.firestoreService.observePaginated(query, {
            limit: limit,
            onData,
            lastResult,
        }, SentPrompt)

    }

    observeForCactusMemberId(memberId: string, options: QueryObserverOptions<SentPrompt>): ListenerUnsubscriber {
        const query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", memberId)
            .orderBy(SentPrompt.Fields.firstSentAt, QuerySortDirection.desc);

        options.queryName = "observeSentPromptsForCactusMemberId=" + memberId;
        return this.firestoreService.observeQuery(query, SentPrompt, options);
    }

    async getPrompts(options: { limit?: number, cursor?: QueryCursor }): Promise<SentPrompt[]> {
        const member = CactusMemberService.sharedInstance.getCurrentCactusMember();
        if (!member) {
            return [];
        }
        const query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", member.id)
            .orderBy(SentPrompt.Fields.firstSentAt, QuerySortDirection.desc).limit(options.limit || 10);
        const results = await this.firestoreService.executeQuery(query, SentPrompt);

        return results.results;
    }

}



