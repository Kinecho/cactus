import FirestoreService, { ListenerUnsubscriber, QueryObserverOptions } from "@web/services/FirestoreService";
import ReflectionResponse, { ReflectionResponseField} from "@shared/models/ReflectionResponse";
import { BaseModelField, Collection } from "@shared/FirestoreBaseModels";
import { QuerySortDirection } from "@shared/types/FirestoreConstants";
import CactusMemberService from "@web/services/CactusMemberService";
import CactusMember from "@shared/models/CactusMember";
import { Config } from "@web/config";
import { PageRoute } from "@shared/PageRoutes";
import StorageService, { LocalStorageKey } from "@web/services/StorageService";
import { calculateStreaks, ResponseMedium, StreakResult } from "@shared/util/ReflectionResponseUtil";
import Logger from "@shared/Logger";

const logger = new Logger("ReflectionResponseService");

export interface ReflectionSaveOptions {
    saveIfAnonymous?: boolean,
    updateReflectionLog?: boolean
}

export const DefaultSaveOptions: ReflectionSaveOptions = {
    saveIfAnonymous: false,
    updateReflectionLog: false,
};

export default class ReflectionResponseService {
    public static sharedInstance = new ReflectionResponseService();
    firestoreService = FirestoreService.sharedInstance;

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.reflectionResponses)
    }

    static getShareableUrl(response?: ReflectionResponse): string | undefined {
        if (!response || !response.shared || !response.id) {
            return;
        }

        return `${ Config.domain }${ PageRoute.SHARED_REFLECTION }/${ response.id }`;

    }

    async shareResponse(response?: ReflectionResponse): Promise<ReflectionResponse | undefined> {
        if (!response) {
            return;
        }
        if (response.shared) {
            return;
        }

        response.shared = true;
        response.sharedAt = new Date();
        return await this.save(response, { saveIfAnonymous: true, updateReflectionLog: false });
    }

    async unShareResponse(response?: ReflectionResponse): Promise<ReflectionResponse | undefined> {
        if (!response) {
            return;
        }
        if (!response.shared) {
            return;
        }

        response.shared = false;
        response.unsharedAt = new Date();
        return await this.save(response, { saveIfAnonymous: true, updateReflectionLog: false });
    }

    async updateResponseMemberName(response: ReflectionResponse, member: CactusMember): Promise<ReflectionResponse | undefined> {
        response.memberFirstName = member.firstName;
        response.memberLastName = member.lastName;
        return await this.save(response);
    }

    static populateMemberFields(response: ReflectionResponse): ReflectionResponse {
        const cactusMember = CactusMemberService.sharedInstance.currentMember;

        if (cactusMember) {
            response.userId = cactusMember.userId;
            response.cactusMemberId = cactusMember.id;
            response.memberEmail = cactusMember.email;
            response.memberFirstName = cactusMember.firstName;
            response.memberLastName = cactusMember.lastName;
            response.mailchimpMemberId = cactusMember.mailchimpListMember ? cactusMember.mailchimpListMember.id : undefined;
            response.mailchimpUniqueEmailId = cactusMember.mailchimpListMember ? cactusMember.mailchimpListMember.unique_email_id : undefined;

        }
        return response;
    }

    static createReflectionResponse(promptId: string, medium: ResponseMedium, promptQuestion?: string): ReflectionResponse | undefined {
        const cactusMember = CactusMemberService.sharedInstance.currentMember;
        if (!cactusMember) {
            logger.log("Unable to get cactus member");
            return;
        }

        const response = new ReflectionResponse();
        response.promptId = promptId;
        response.promptQuestion = promptQuestion;
        response.userId = cactusMember.userId;
        response.cactusMemberId = cactusMember.id;
        response.memberEmail = cactusMember.email;
        response.memberFirstName = cactusMember.firstName;
        response.memberLastName = cactusMember.lastName;
        response.responseMedium = medium;
        response.mailchimpMemberId = cactusMember.mailchimpListMember ? cactusMember.mailchimpListMember.id : undefined;
        response.mailchimpUniqueEmailId = cactusMember.mailchimpListMember ? cactusMember.mailchimpListMember.unique_email_id : undefined;

        return response;
    }

    async save(model: ReflectionResponse, options: ReflectionSaveOptions = DefaultSaveOptions): Promise<ReflectionResponse | undefined> {
        const {
            saveIfAnonymous = DefaultSaveOptions.saveIfAnonymous,
            updateReflectionLog = DefaultSaveOptions.updateReflectionLog,
        } = options;


        if (updateReflectionLog) {
            model.addReflectionLog(new Date())
        }

        //Anytime we save from the frontend, set to True. The db trigger will update this as appropriate.
        model.mightNeedInsightsUpdate = true;
        if (model.cactusMemberId) {
            const saved = this.firestoreService.save(model);
            //TODO: using cactusMemberId on this may be a weak way to go - we might want to check the current logged in status of the member instead. (shrug)
            return saved;
        }
        if (!model.cactusMemberId) {
            logger.warn("No cactusMemberId found on ReflectionResponse, Saving to local storage");
            StorageService.saveModel(LocalStorageKey.anonReflectionResponse, model, model.promptId);

            return model;
        }
    }

    async getForMailchimpMemberId(memberId: string): Promise<ReflectionResponse[]> {
        const query = this.getCollectionRef().where(ReflectionResponseField.mailchimpMemberId, "==", memberId)
        .orderBy(BaseModelField.createdAt, QuerySortDirection.desc);
        try {
            const results = await this.firestoreService.executeQuery(query, ReflectionResponse);
            return results.results;
        } catch (error) {
            logger.error("Failed to fetch reflection responses", error);
            return [];
        }
    }

    observeSharedReflection(reflectionId: string, options: { onData: (model: ReflectionResponse | undefined, error?: any) => void }): ListenerUnsubscriber | undefined {
        return this.firestoreService.observeById(reflectionId, ReflectionResponse, {
            queryName: "observeSharedReflection",
            onData: (model: ReflectionResponse | undefined, error) => {
                if (model && model.shared) {
                    options.onData(model, error);
                } else {
                    options.onData(undefined, error);
                }

            }
        });
    }

    observeById(reflectionId: string, options: { onData: (model: ReflectionResponse | undefined, error?: any) => void }): ListenerUnsubscriber{
        return this.firestoreService.observeById(reflectionId, ReflectionResponse, {
            queryName: "observeReflectionById",
            onData: (model: ReflectionResponse | undefined, error) => {
                options.onData(model, error);
            }
        });
    }

    observeForPromptId(promptId: string, options: QueryObserverOptions<ReflectionResponse> & { member?: CactusMember | null }): ListenerUnsubscriber | undefined {
        const member: CactusMember | undefined = options.member ?? CactusMemberService.sharedInstance.currentMember;
        if (!member) {
            options.onData([]);
            return;
        }

        const query = this.getCollectionRef().where(ReflectionResponse.Field.cactusMemberId, "==", member.id)
        .where(ReflectionResponse.Field.promptId, "==", promptId)
        .orderBy(BaseModelField.createdAt, QuerySortDirection.desc);

        options.queryName = "ReflectionResponseService:observeForPromptId";
        return this.firestoreService.observeQuery(query, ReflectionResponse, options);
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

    async getAllReflections(): Promise<ReflectionResponse[]> {
        const member = CactusMemberService.sharedInstance.currentMember;
        if (!member) {
            logger.warn("ReflectionResponseService.getTotalReflectionDurationMsL No current cactus member found");
            return [];
        }
        const query = this.getCollectionRef().where(ReflectionResponse.Field.cactusMemberId, "==", member.id).orderBy(BaseModelField.createdAt, QuerySortDirection.desc);
        const responses = await this.firestoreService.executeQuery(query, ReflectionResponse);
        return responses.results;
    }

    async getTotalReflectionDurationMs(): Promise<number> {
        const reflections = await this.getAllReflections();
        const totalDuration = reflections.reduce((duration, doc) => {
            const current = doc.reflectionDurationMs || 0;
            logger.log("current response duration ", current);
            return duration + (Number(current) || 0);
        }, 0);
        logger.log("total duration is", totalDuration);
        return totalDuration;
    }

    static getCurrentStreaks(reflections: ReflectionResponse[], member?: CactusMember): StreakResult {
        return calculateStreaks(reflections, { timeZone: member?.timeZone || undefined });
    }
}
