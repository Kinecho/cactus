import FirestoreService, {ListenerUnsubscriber, QueryObserverOptions} from "@web/services/FirestoreService";
import ReflectionResponse, {ReflectionResponseField, ResponseMedium} from "@shared/models/ReflectionResponse";
import {BaseModelField, Collection} from "@shared/FirestoreBaseModels";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";
import CactusMemberService from "@web/services/CactusMemberService";
import CactusMember from "@shared/models/CactusMember";


export default class ReflectionResponseService {
    public static sharedInstance = new ReflectionResponseService();
    firestoreService = FirestoreService.sharedInstance;

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.reflectionResponses)
    }

    createReflectionResponse(promptId: string, medium: ResponseMedium, promptQuestion?: string): ReflectionResponse | undefined {
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

    observeForPromptId(promptId: string, options: QueryObserverOptions<ReflectionResponse>): ListenerUnsubscriber | undefined {
        let queryUnsubscriber: ListenerUnsubscriber | undefined = undefined;
        let currentMember: CactusMember | undefined = undefined;
        const memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
            onData: ({member}) => {
                const currentId = currentMember && currentMember.id;
                const newId = member && member.id;
                if (currentId !== newId) {
                    if (queryUnsubscriber) {
                        queryUnsubscriber();
                    }
                }

                if (!member) {
                    return;
                }

                const query = this.getCollectionRef().where(ReflectionResponse.Field.cactusMemberId, "==", member.id)
                    .where(ReflectionResponse.Field.promptId, "==", promptId)
                    .orderBy(BaseModelField.createdAt, QuerySortDirection.desc);

                options.queryName = "ReflectionResponseService:observeForPromptId";
                queryUnsubscriber = this.firestoreService.observeQuery(query, ReflectionResponse, options);
            }

        });

        return () => {
            if (queryUnsubscriber) {
                queryUnsubscriber();
            }
            if (memberUnsubscriber) {
                memberUnsubscriber();
            }
        }
    }

    observeForMailchimpMemberId(memberId: string, options: QueryObserverOptions<ReflectionResponse>): ListenerUnsubscriber {
        const query = this.getCollectionRef().where(ReflectionResponseField.mailchimpMemberId, "==", memberId)
            .orderBy(BaseModelField.createdAt, QuerySortDirection.desc);

        options.queryName = "ReflectionResponseService:observeForMailchimpMemberId";
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