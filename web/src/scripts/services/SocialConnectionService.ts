import FirestoreService, {ListenerUnsubscriber, Query, QueryObserverOptions} from "@web/services/FirestoreService";
import SocialConnection, {SocialConnectionFields} from "@shared/models/SocialConnection";
import {Collection} from "@shared/FirestoreBaseModels";
import {FirebaseUser, getAuth, Unsubscribe} from "@web/firebase";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";
import CactusMemberService from "@web/services/CactusMemberService";

export default class SocialConnectionService {
    public static sharedInstance = new SocialConnectionService();
    firestoreService = FirestoreService.sharedInstance;

    authUnsubscriber?: Unsubscribe;

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.socialConnections);
    }

    async executeQuery(query: Query) {
        return this.firestoreService.executeQuery(query, SocialConnection);
    }

    async getFirst(query: Query) {
        return this.firestoreService.getFirst(query, SocialConnection);
    }

    async getResults(query: Query): Promise<SocialConnection[] | undefined> {
        const queryResult = await this.executeQuery(query);
        return queryResult.results || [];
    }

    async save(model: SocialConnection): Promise<SocialConnection | undefined> {
        return this.firestoreService.save(model);
    }

    async getByMemberId(memberId: string): Promise<SocialConnection[] | undefined> {
        const query = this.getCollectionRef().where(SocialConnectionFields.memberId, "==", memberId);
        return await this.getResults(query);
    }

    async getByFriendId(friendMemberId: string): Promise<SocialConnection[] | undefined> {
        const query = this.getCollectionRef().where(SocialConnectionFields.friendMemberId, "==", friendMemberId);
        return await this.getResults(query);
    }

    observeConnections(memberId: string, options: QueryObserverOptions<SocialConnection>): ListenerUnsubscriber {
        const query = this.getCollectionRef()
            .where(SocialConnection.Fields.memberId, "==", memberId)
            .orderBy(SocialConnection.Fields.createdAt, QuerySortDirection.desc);

        options.queryName = "observeSocialConnectionsForCactusMemberId=" + memberId;
        return this.firestoreService.observeQuery(query, SocialConnection, options);
    }
}