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

    async save(model: SocialConnection): Promise<SocialConnection | undefined> {
        return this.firestoreService.save(model);
    }

    async getByMemberId(memberId: string): Promise<SocialConnection | undefined> {
        const query = this.getCollectionRef().where(SocialConnectionFields.memberId, "==", memberId);
        return await this.getFirst(query);
    }

    async getByFriendId(friendId: string): Promise<SocialConnection | undefined> {
        const query = this.getCollectionRef().where(SocialConnectionFields.friendId, "==", friendId);
        return await this.getFirst(query);
    }

    observeRequestedConnections(memberId: string, options: QueryObserverOptions<SocialConnection>): ListenerUnsubscriber {
        const query = this.getCollectionRef()
            .where(SocialConnection.Fields.friendId, "==", memberId)
            .where(SocialConnection.Fields.confirmed, "==", false)
            .orderBy(SocialConnection.Fields.sentAt, QuerySortDirection.desc);

        options.queryName = "observeRequestedConnectionsForCactusMemberId=" + memberId;
        return this.firestoreService.observeQuery(query, SocialConnection, options);
    }

    observeConnections(memberId: string, options: QueryObserverOptions<SocialConnection>): ListenerUnsubscriber {
        const query = this.getCollectionRef()
            .where(SocialConnection.Fields.confirmedMembers, "array-contains", memberId)
            .orderBy(SocialConnection.Fields.sentAt, QuerySortDirection.desc);

        options.queryName = "observeSocialConnectionsForCactusMemberId=" + memberId;
        return this.firestoreService.observeQuery(query, SocialConnection, options);
    }

    async confirm(connection: SocialConnection): Promise<SocialConnection | undefined> {
        connection.confirmed = true;
        connection.confirmedAt = new Date();
        return this.save(connection);
    }
}