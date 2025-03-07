import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";
import ReflectionResponse, {ReflectionResponseField} from "@shared/models/ReflectionResponse";
import SocialConnection from "@shared/models/SocialConnection";
import {SocialActivityFeedEvent, SocialActivityType} from "@shared/types/SocialTypes";
import {Collection} from "@shared/FirestoreBaseModels";
import AdminSocialConnectionService from "@admin/services/AdminSocialConnectionService";
import Logger from "@shared/Logger";

const logger = new Logger("AdminSocialActivityService");

export default class AdminSocialActivityService {
    protected static sharedInstance: AdminSocialActivityService;

    public static initialize(): AdminSocialActivityService {
        AdminSocialActivityService.sharedInstance = new AdminSocialActivityService();
        return AdminSocialActivityService.sharedInstance;
    }

    public static getSharedInstance(): AdminSocialActivityService {
        if (AdminSocialActivityService.sharedInstance) {
            return AdminSocialActivityService.sharedInstance;
        }
        logger.error("no shared instance of AdminSocialActivityService is yet available. Initializing it now (in the getter)");
        return AdminSocialActivityService.initialize();

    }

    getReflectionResponseCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.reflectionResponses);
    }

    firestoreService: AdminFirestoreService;

    constructor() {
        this.firestoreService = AdminFirestoreService.getSharedInstance();

    }

    async getActivityFeedForMember(memberId: string): Promise<SocialActivityFeedEvent[]> {
        logger.log("Fetching activity feed events for ", memberId);
        const startDate = new Date();
        const socialConnections = await AdminSocialConnectionService.getSharedInstance().getConnectionsForMember(memberId);

        //as of 2019-12-13, firestore "in" queries only support 10 items in teh array
        const friendIds = this.friendIds(socialConnections).slice(0, 9);
        if (friendIds.length === 0) {
            return [];
        }

        // include the member viewing in the feed
        const feedMemberIds = friendIds.concat([memberId]);
        const query = this.getReflectionResponseCollectionRef().where(ReflectionResponseField.cactusMemberId, 'in', feedMemberIds)
            .limit(20)
            .orderBy('createdAt', QuerySortDirection.desc);
        const reflectionResponses = await this.firestoreService.executeQuery(query, ReflectionResponse);
        const endDate = new Date();
        logger.log(`getActivityFeedForMember query processed in ${endDate.getTime() - startDate.getTime()}ms`);
        return this.feedEventsFor(reflectionResponses.results);
    }

    friendIds(socialConnections: SocialConnection[]): Array<string> {
        return socialConnections.map((s: SocialConnection) => s.friendMemberId)
    }

    feedEventsFor(reflectionResponses: ReflectionResponse[]): SocialActivityFeedEvent[] {
        return reflectionResponses.map((reflectionResponse: ReflectionResponse) => AdminSocialActivityService.reflectionResponseToEvent(reflectionResponse));
    }

    static reflectionResponseToEvent(reflectionResponse: ReflectionResponse): SocialActivityFeedEvent {
        return {
            eventType: SocialActivityType.ReflectionResponse,
            eventId: reflectionResponse.id,
            occurredAt: reflectionResponse.createdAt,
            memberId: reflectionResponse.cactusMemberId,
            payload: {
                promptId: reflectionResponse.promptId,
                promptQuestion: reflectionResponse.promptQuestion
            }
        };
    }
}