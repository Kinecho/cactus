import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import {Collection} from "@shared/FirestoreBaseModels";
import MailchimpService from "@shared/services/MailchimpService";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import {getDateFromISOString, getMailchimpDateString} from "@shared/util/DateUtil";
import {
    MergeField,
    TagName,
    TagStatus,
    UpdateMergeFieldRequest, UpdateMergeFieldResponse, UpdateTagResponse,
    UpdateTagsRequest
} from "@shared/mailchimp/models/MailchimpTypes";


export interface ResetUserResponse {
    success: boolean
    unknownError?: any
    mergeResponse: UpdateMergeFieldResponse,
    tagResponse: UpdateTagResponse,
    lastReplyString?:string,
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

    getCollectionRef(){
        return this.firestoreService.getCollectionRef(Collection.reflectionResponses);
    }

    firestoreService: AdminFirestoreService;

    constructor() {
        this.firestoreService = AdminFirestoreService.getSharedInstance();

    }

    async save(model: ReflectionResponse): Promise<ReflectionResponse> {
        return this.firestoreService.save(model);
    }


    async getResponseForCampaignId(memberId: string, campaignId: string): Promise<ReflectionResponse> {
        const collection = this.firestoreService.getCollectionRef(Collection.reflectionResponses);
        // collection.where()
        console.log("getting response from collection", collection);

        throw new Error("Not implemented");
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

        return {success: tagResponse.success && tagResponse.success, tagResponse, mergeResponse, lastReplyString: lastReplyString};
    }
}