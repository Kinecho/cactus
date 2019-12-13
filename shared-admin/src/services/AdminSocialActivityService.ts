import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";
import ReflectionResponse, {ReflectionResponseField} from "@shared/models/ReflectionResponse";
import SocialConnection from "@shared/models/SocialConnection";
import {SocialActivityFeedEvent, SocialActivityType} from "@shared/types/SocialTypes";
import {Collection} from "@shared/FirestoreBaseModels";
import AdminSocialConnectionService from "@admin/services/AdminSocialConnectionService";


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
        console.error("no shared instance of AdminSocialActivityService is yet available. Initializing it now (in the getter)");
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
        const socialConnections = await AdminSocialConnectionService.getSharedInstance().getConnectionsForMember(memberId);

        const query = this.getReflectionResponseCollectionRef().where(ReflectionResponseField.cactusMemberId, 'in', this.friendIds(socialConnections))
            .limit(20)
            .orderBy('createdAt', QuerySortDirection.desc);
        const reflectionResponses = await this.firestoreService.executeQuery(query, ReflectionResponse);

        return this.feedEventsFor(reflectionResponses.results);
    }

    friendIds(socialConnections: SocialConnection[]): Array<string> {
        return socialConnections.map(function (s: SocialConnection) {
            return s.friendMemberId
        })
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