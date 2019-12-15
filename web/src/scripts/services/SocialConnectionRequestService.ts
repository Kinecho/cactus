import FirestoreService, {ListenerUnsubscriber, Query, QueryObserverOptions} from "@web/services/FirestoreService";
import SocialConnection from "@shared/models/SocialConnection";
import {Collection} from "@shared/FirestoreBaseModels";
import {Unsubscribe} from "@web/firebase";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";
import SocialConnectionService from "@web/services/SocialConnectionService";
import {SocialConnectionRequest, SocialConnectionRequestFields} from "@shared/models/SocialConnectionRequest";


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

    async getResults(query: Query): Promise<SocialConnectionRequest[] | undefined> {
        try {
            const queryResult = await this.executeQuery(query);
            return queryResult.results;
        } catch(e) {
            return [];
        }
    }

    async save(model: SocialConnectionRequest): Promise<SocialConnectionRequest | undefined> {
        return this.firestoreService.save(model);
    }

    async getByMemberId(memberId: string): Promise<SocialConnectionRequest[] | undefined> {
        const query = this.getCollectionRef().where(SocialConnectionRequestFields.memberId, "==", memberId);
        return await this.getResults(query);
    }

    async getByFriendId(friendMemberId: string): Promise<SocialConnectionRequest[] | undefined> {
        const query = this.getCollectionRef().where(SocialConnectionRequestFields.friendMemberId, "==", friendMemberId);
        return await this.getResults(query);
    }

    async getSentByMemberId(memberId: string) {
        const query = this.getCollectionRef()
            .where(SocialConnectionRequest.Fields.memberId, "==", memberId)
            .where(SocialConnectionRequest.Fields.confirmedAt, "==", null)
            .where(SocialConnectionRequest.Fields.rejectedAt, "==", null)
            .orderBy(SocialConnectionRequest.Fields.sentAt, QuerySortDirection.desc);
        return await this.getResults(query);
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
            /* use generated doc ids in lew of having unique index constraints */
            const memberConnection = new SocialConnection();
                  memberConnection.id = this.generateDocId(connectionRequest.memberId, connectionRequest.friendMemberId);
                  memberConnection.memberId = connectionRequest.memberId;
                  memberConnection.friendMemberId = connectionRequest.friendMemberId;

            const resultMember = await SocialConnectionService.sharedInstance.save(memberConnection);

            const friendConnection = new SocialConnection();
                  friendConnection.id = this.generateDocId(connectionRequest.friendMemberId, connectionRequest.memberId);
                  friendConnection.memberId = connectionRequest.friendMemberId;
                  friendConnection.friendMemberId = connectionRequest.memberId;

            const resultFriend = await SocialConnectionService.sharedInstance.save(friendConnection);

            connectionRequest.confirmedAt = new Date();
            return await this.save(connectionRequest);
        } catch (error) {
            console.error("Failed to create connections", error);
            return;
        }
    }

    generateDocId(id1: string, id2: string): string {
        return id1 + '_' + id2;
    }
}