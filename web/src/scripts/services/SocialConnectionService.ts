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

    constructor() {
    }

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

    async getFriends(memberId: string): Promise<SocialConnection[]> {
        const member = await CactusMemberService.sharedInstance.getById(memberId);
        if (member && member.id) {
          const query = this.getCollectionRef()
            .where(SocialConnection.Fields.memberId, "==", member.id)
            .where(SocialConnection.Fields.confirmed, "==", true)
            .orderBy(SocialConnection.Fields.confirmedAt, QuerySortDirection.desc);
          const results = await this.firestoreService.executeQuery(query, SocialConnection);
          return results.results;
        }

        return [];
    }
}