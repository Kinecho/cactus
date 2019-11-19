import FirestoreService, {ListenerUnsubscriber, Query} from "@web/services/FirestoreService";
import {Collection} from "@shared/FirestoreBaseModels";
import {DocObserverOptions} from "@shared/types/FirestoreTypes";
import MemberProfile from "@shared/models/MemberProfile";

export default class MemberProfileService {
    public static sharedInstance = new MemberProfileService();
    firestoreService = FirestoreService.sharedInstance;

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.memberProfiles)
    }

    async executeQuery(query: Query) {
        return this.firestoreService.executeQuery(query, MemberProfile);
    }

    async getFirst(query: Query) {
        return this.firestoreService.getFirst(query, MemberProfile);
    }

    async getByMemberId(id: string): Promise<MemberProfile | undefined> {
        return await this.firestoreService.getById(id, MemberProfile);
    }

    async getByEmail(email: string): Promise<MemberProfile | undefined> {
        const query = this.getCollectionRef().where(MemberProfile.Field.email, "==", email).where(MemberProfile.Field.isPublic, "==", true);
        return this.getFirst(query);
    }

    async getByUserId(userId: string): Promise<MemberProfile|undefined> {
        const query = this.getCollectionRef().where(MemberProfile.Field.userId, "==", userId).where(MemberProfile.Field.isPublic, "==", true);
        return this.getFirst(query);
    }

    observeByEmail(email: string, options: DocObserverOptions<MemberProfile>): ListenerUnsubscriber {
        const query = this.getCollectionRef().where(MemberProfile.Field.email, "==", email).where(MemberProfile.Field.isPublic, "==", true);
        return this.firestoreService.observeFirst(query, MemberProfile, options);
    }

    observeByUserId(userId: string, options: DocObserverOptions<MemberProfile>): ListenerUnsubscriber {
        const query = this.getCollectionRef().where(MemberProfile.Field.userId, "==", userId).where(MemberProfile.Field.isPublic, "==", true);
        return this.firestoreService.observeFirst(query, MemberProfile, options);
    }

    observeByMemberId(id: string, options: DocObserverOptions<MemberProfile>): ListenerUnsubscriber {
        const query = this.getCollectionRef().where(MemberProfile.Field.cactusMemberId, "==", userId).where(MemberProfile.Field.isPublic, "==", true);
        return this.firestoreService.observeFirst(query, MemberProfile, options);
    }

}



