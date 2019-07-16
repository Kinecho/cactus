import FirestoreService, {ListenerUnsubscriber, QueryObserverOptions} from "@web/services/FirestoreService";
import ReflectionResponse, {ReflectionResponseField, ResponseMedium} from "@shared/models/ReflectionResponse";
import {BaseModelField, Collection} from "@shared/FirestoreBaseModels";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";
import CactusMemberService from "@web/services/CactusMemberService";


export default class ReflectionResponseService {
    public static sharedInstance = new ReflectionResponseService();
    firestoreService = FirestoreService.sharedInstance;

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.reflectionResponses)
    }

    async createReflectionResponse(promptId: string, medium: ResponseMedium, promptQuestion?: string): Promise<ReflectionResponse | undefined> {
        const cactusMember = CactusMemberService.sharedInstance.getCurrentCactusMember();
        if (!cactusMember) {
            console.log("Unable to get cactus member");
            return;
        }

        const response = new ReflectionResponse();
        response.promptId = promptId;
        response.promptQuestion = promptQuestion;
        response.userId = cactusMember.userId;
        response.cactusMemberId = cactusMember.id;
        response.memberEmail = cactusMember.email;
        response.responseMedium = ResponseMedium.JOURNAL_WEB;
        response.mailchimpMemberId = cactusMember.mailchimpListMember ? cactusMember.mailchimpListMember.id : undefined;
        response.mailchimpUniqueEmailId = cactusMember.mailchimpListMember ? cactusMember.mailchimpListMember.unique_email_id : undefined;


        return response;
    }

    async save(model: ReflectionResponse): Promise<ReflectionResponse | undefined> {
        return this.firestoreService.save(model);
    }

    async getForMailchimpMemberId(memberId: string): Promise<ReflectionResponse[]> {
        const query = this.getCollectionRef().where(ReflectionResponseField.mailchimpMemberId, "==", memberId)
            .orderBy(BaseModelField.createdAt, QuerySortDirection.desc);
        try {
            const results = await this.firestoreService.executeQuery(query, ReflectionResponse);
            return results.results;
        } catch (error) {
            console.error("Failed to fetch reflection responses", error);
            return [];
        }
    }

    observeForMailchimpMemberId(memberId: string, options: QueryObserverOptions<ReflectionResponse>): ListenerUnsubscriber {
        const query = this.getCollectionRef().where(ReflectionResponseField.mailchimpMemberId, "==", memberId)
            .orderBy(BaseModelField.createdAt, QuerySortDirection.desc);

        options.queryName = "observeForMailchimpMemberId";
        return this.firestoreService.observeQuery(query, ReflectionResponse, options);

    }

    async getById(id: string): Promise<ReflectionResponse | undefined> {
        return await this.firestoreService.getById(id, ReflectionResponse);
    }

    async delete(response: ReflectionResponse): Promise<ReflectionResponse | undefined> {
        if (!response.id) {
            return;
        }
        return this.firestoreService.delete(response.id, ReflectionResponse);
    }

}