import FirestoreService, {ListenerUnsubscriber, Query, QueryObserverOptions, Transaction} from "@web/services/FirestoreService";
import SocialConnection, {SocialConnectionRequest, SocialConnectionRequestFields} from "@shared/models/SocialConnection";
import {Collection} from "@shared/FirestoreBaseModels";
import {FirebaseUser, getAuth, Unsubscribe} from "@web/firebase";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";
import CactusMemberService from "@web/services/CactusMemberService";
import SocialConnectionService from "@web/services/SocialConnectionService";


export default class SocialConnectionRequestService {
    public static sharedInstance = new SocialConnectionRequestService();
    firestoreService = FirestoreService.sharedInstance;

    authUnsubscriber?: Unsubscribe;

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.socialConnectionRequests);
    }

    async executeQuery(query: Query) {
        return this.firestoreService.executeQuery(query, SocialConnectionRequest);
    }

    async getFirst(query: Query) {
        return this.firestoreService.getFirst(query, SocialConnectionRequest);
    }

    async save(model: SocialConnectionRequest): Promise<SocialConnectionRequest | undefined> {
        return this.firestoreService.save(model);
    }

    async getByMemberId(memberId: string): Promise<SocialConnectionRequest | undefined> {
        const query = this.getCollectionRef().where(SocialConnectionRequestFields.memberId, "==", memberId);
        return await this.getFirst(query);
    }

    async getByFriendId(friendMemberId: string): Promise<SocialConnectionRequest | undefined> {
        const query = this.getCollectionRef().where(SocialConnectionRequestFields.friendMemberId, "==", friendMemberId);
        return await this.getFirst(query);
    }

    observeSentConnectionRequests(memberId: string, options: QueryObserverOptions<SocialConnectionRequest>): ListenerUnsubscriber {
        const query = this.getCollectionRef()
            .where(SocialConnectionRequest.Fields.memberId, "==", memberId)
            .where(SocialConnectionRequest.Fields.confirmedAt, "==", null)
            .where(SocialConnectionRequest.Fields.rejectedAt, "==", null)
            .orderBy(SocialConnectionRequest.Fields.sentAt, QuerySortDirection.desc);

        options.queryName = "observeSentConnectionsForCactusMemberId=" + memberId;
        return this.firestoreService.observeQuery(query, SocialConnectionRequest, options);
    }

    observeReceivedConnectionRequests(memberId: string, options: QueryObserverOptions<SocialConnectionRequest>): ListenerUnsubscriber {
        const query = this.getCollectionRef()
            .where(SocialConnectionRequest.Fields.friendMemberId, "==", memberId)
            .where(SocialConnectionRequest.Fields.confirmedAt, "==", null)
            .where(SocialConnectionRequest.Fields.rejectedAt, "==", null)
            .orderBy(SocialConnectionRequest.Fields.sentAt, QuerySortDirection.desc);

        options.queryName = "observeReceivedConnectionsForCactusMemberId=" + memberId;
        return this.firestoreService.observeQuery(query, SocialConnectionRequest, options);
    }

    async confirmRequest(connectionRequest: SocialConnectionRequest): Promise<SocialConnectionRequest | undefined> {
        try {
            return await FirestoreService.sharedInstance.firestore.runTransaction(async transaction => {
                connectionRequest.confirmedAt = new Date();

                const memberConnection = new SocialConnection();
                      memberConnection.memberId = connectionRequest.memberId;
                      memberConnection.friendMemberId = connectionRequest.friendMemberId;

                const resultMember = await SocialConnectionService.sharedInstance.save(memberConnection);

                const friendConnection = new SocialConnection();
                      friendConnection.memberId = connectionRequest.friendMemberId;
                      friendConnection.friendMemberId = connectionRequest.memberId;

                const resultFriend = await SocialConnectionService.sharedInstance.save(memberConnection);

                return await this.save(connectionRequest);
            });
        } catch (error) {
            console.error("Failed to create connections", error);
            return;
        }
    }
}