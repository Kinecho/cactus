import FirestoreService, {
    ListenerUnsubscriber,
    PageListenerResult,
    PageResult,
    Query,
    QueryCursor,
    QueryObserverOptions
} from "@web/services/FirestoreService";
import SentPrompt from "@shared/models/SentPrompt";
import {Collection} from "@shared/FirestoreBaseModels";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";
import CactusMemberService from "@web/services/CactusMemberService";
import {toTimestamp} from "@shared/util/FirestoreUtil";
import {DocObserverOptions} from "@shared/types/FirestoreTypes";
import Logger from "@shared/Logger";

const logger = new Logger("SentPromptService");

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
    onlyCompleted: boolean,
    lastResult?: PageResult<SentPrompt>,
    onData: (pageResult: PageListenerResult<SentPrompt>) => void
}

export interface FutureSentPromptPageListenerOptions {
    memberId: string,
    since: Date,
    limit?: number,
    lastResult?: PageResult<SentPrompt>,
    onlyCompleted: boolean,
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
            logger.error("Failed to get sent prompt by id", e);
        }

    }

    async delete(id: string): Promise<SentPrompt | undefined> {
        return await this.firestoreService.delete(id, SentPrompt);
    }

    async getSentPrompt(promptId: string): Promise<SentPrompt | undefined> {
        const member = CactusMemberService.sharedInstance.currentMember;
        if (!member) {
            logger.warn("Unable to get current member. Can not delete the sentQuestion");
            return;
        }

        try {
            const query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", member.id)
                .where(SentPrompt.Fields.promptId, "==", promptId);
            return this.firestoreService.getFirst(query, SentPrompt);
        } catch (e) {
            logger.error("failed to get sent prompt by promptId", e);
        }

    }

    async deleteForPromptId(promptId: string): Promise<SentPrompt | undefined> {
        const sentPrompt = await this.getSentPrompt(promptId);
        if (sentPrompt && sentPrompt.id) {
            try {
                return this.delete(sentPrompt.id);
            } catch (e) {
                logger.error(`Failed to delete prompt for promptId=${promptId} and sentPromptId=${sentPrompt.id}`)
            }

        }
    }

    observeFuturePrompts(options: FutureSentPromptPageListenerOptions): ListenerUnsubscriber {
        const {memberId, since, lastResult, limit, onData, onlyCompleted} = options;

        let query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", memberId)
            .orderBy(SentPrompt.Fields.firstSentAt, QuerySortDirection.desc)
            .where(SentPrompt.Fields.firstSentAt, ">", toTimestamp(since));

        if (onlyCompleted) {
            query = query.where(SentPrompt.Fields.completed, "==", true)
        }

        return this.firestoreService.observePaginated(query, {
            limit: limit,
            onData,
            lastResult,
        }, SentPrompt)

    }

    observePage(options: SentPromptPageListenerOptions): ListenerUnsubscriber {
        const {memberId, beforeOrEqualTo, lastResult, limit, onData, onlyCompleted} = options;

        let query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", memberId)
            .orderBy(SentPrompt.Fields.firstSentAt, QuerySortDirection.desc)

        if (beforeOrEqualTo) {
            const beforeTimestamp = toTimestamp(beforeOrEqualTo);
            query = query.where(SentPrompt.Fields.firstSentAt, "<=", beforeTimestamp)
        }

        if (onlyCompleted) {
            query = query.where(SentPrompt.Fields.completed, "==", true)
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

    observeByPromptId(memberId: string, promptId: string, options: DocObserverOptions<SentPrompt>): ListenerUnsubscriber {
        const query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", memberId)
            .where(SentPrompt.Fields.promptId, "==", promptId)
            .orderBy(SentPrompt.Fields.firstSentAt, QuerySortDirection.desc);

        options.queryName = "observeByPromptId" + promptId;
        return this.firestoreService.observeFirst(query, SentPrompt, options);
    }

    async getPrompts(options: { limit?: number, cursor?: QueryCursor }): Promise<SentPrompt[]> {
        const member = CactusMemberService.sharedInstance.currentMember;
        if (!member) {
            return [];
        }
        const query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", member.id)
            .orderBy(SentPrompt.Fields.firstSentAt, QuerySortDirection.desc).limit(options.limit || 10);
        const results = await this.firestoreService.executeQuery(query, SentPrompt);

        return results.results;
    }

}



