import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import {Collection} from "@shared/FirestoreBaseModels";
import MailchimpService from "@admin/services/MailchimpService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import {getDateFromISOString, getMailchimpDateString} from "@shared/util/DateUtil";
import {
    MergeField,
    TagName,
    TagStatus,
    UpdateMergeFieldRequest, UpdateMergeFieldResponse, UpdateTagResponse,
    UpdateTagsRequest
} from "@shared/mailchimp/models/MailchimpTypes";
import {ApiResponse} from "@shared/api/ApiTypes";


export interface ResetUserResponse {
    success: boolean
    unknownError?: any
    mergeResponse: UpdateMergeFieldResponse,
    tagResponse: UpdateTagResponse,
    lastReplyString?: string,
}


export default class AdminReflectionResponseService {
    protected static sharedInstance: AdminReflectionResponseService;

    public static initialize(): AdminReflectionResponseService {
        AdminReflectionResponseService.sharedInstance = new AdminReflectionResponseService();
        return AdminReflectionResponseService.sharedInstance;
    }

    public static getSharedInstance(): AdminReflectionResponseService {
        if (AdminReflectionResponseService.sharedInstance) {
            return AdminReflectionResponseService.sharedInstance;
        }
        console.error("no shared instance of AdminReflectionResponseService is yet available. Initializing it now (in the getter)");
        return AdminReflectionResponseService.initialize();

    }

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.reflectionResponses);
    }

    firestoreService: AdminFirestoreService;

    constructor() {
        this.firestoreService = AdminFirestoreService.getSharedInstance();

    }

    async save(model: ReflectionResponse): Promise<ReflectionResponse> {
        return this.firestoreService.save(model);
    }

    async getById(id?: string): Promise<ReflectionResponse | undefined> {
        if (!id) {
            return;
        }

        return this.firestoreService.getById(id, ReflectionResponse);
    }

    async getResponseForCampaignId(memberId: string, campaignId: string): Promise<ReflectionResponse> {
        const collection = this.firestoreService.getCollectionRef(Collection.reflectionResponses);
        // collection.where()
        console.log("getting response from collection", collection);

        throw new Error("Not implemented");
    }

    static async setLastJournalDate(email?: string, date?: Date): Promise<ApiResponse> {
        const mailchimpService = MailchimpService.getSharedInstance();

        if (!email) {
            console.warn("No email provided to setLastJournalDate function");
            return {success: false, error: "No email provided"};
        }

        const lastJournalString = getMailchimpDateString(date);
        const lastJournalDate = getDateFromISOString(lastJournalString);
        const mergeRequest: UpdateMergeFieldRequest = {
            email,
            mergeFields: {
                [MergeField.LAST_JNL]: lastJournalString
            }
        };

        const mergeResponse = await mailchimpService.updateMergeFields(mergeRequest);
        await AdminCactusMemberService.getSharedInstance().updateLastJournalByEmail(email, lastJournalDate);
        return mergeResponse;

    }

    static async resetUserReminder(email?: string): Promise<ResetUserResponse> {
        const mailchimpService = MailchimpService.getSharedInstance();
        const memberService = AdminCactusMemberService.getSharedInstance();
        if (!email) {
            console.warn("No email given provided to resetUserReminder function");
            return {
                success: false,
                unknownError: "No email provided to resetUser function",
                mergeResponse: {success: false},
                tagResponse: {success: false}
            };
        }

        const lastReplyString = getMailchimpDateString();
        const lastReplyDate = getDateFromISOString(lastReplyString);
        const mergeRequest: UpdateMergeFieldRequest = {
            email,
            mergeFields: {
                [MergeField.LAST_REPLY]: lastReplyString
            }
        };

        const mergeResponse = await mailchimpService.updateMergeFields(mergeRequest);

        const tagRequest: UpdateTagsRequest = {
            email,
            tags: [
                {
                    name: TagName.NEEDS_ONBOARDING_REMINDER,
                    status: TagStatus.INACTIVE
                },
            ]
        };

        await memberService.updateLastReplyByEmail(email, lastReplyDate);

        const tagResponse = await mailchimpService.updateTags(tagRequest);

        return {
            success: tagResponse.success && tagResponse.success,
            tagResponse,
            mergeResponse,
            lastReplyString: lastReplyString
        };
    }
}