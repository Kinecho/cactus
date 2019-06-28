import axios, {AxiosInstance} from "axios";
import {
    CampaignContentRequest,
    CampaignContent,
    CreateCampaignRequest, UpdateCampaignRequest
} from "@shared/mailchimp/models/CreateCampaignRequest";
import {
    Audience,
    AudienceListResponse,
    Automation,
    AutomationListResponse,
    Campaign,
    SendChecklist,
    ListResponse,
    Segment,
    SegmentListResponse,
    SegmentType,
    Template,
    TemplateListResponse,
    TemplateSortField,
    TemplateType,
    CampaignScheduleBody,
    PaginationParameters,
    CampaignListResponse,
    GetCampaignsOptions,
    DEFAULT_PAGINATION,
    defaultPageSize,
    getDefaultCampaignFetchOptions,
    UpdateTagsRequest,
    UpdateMergeFieldRequest,
    CampaignSearchResultListResponse,
    SearchMembersResult,
    SearchMembersOptions,
    getSearchMemberOptionsDefaults, AutomationEmailListResponse, AutomationEmail
} from "@shared/mailchimp/models/MailchimpTypes";
import ListMember, {ListMemberStatus, MergeField} from "@shared/mailchimp/models/ListMember";
import * as md5 from "md5";
import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import SubscriptionResult, {SubscriptionResultStatus} from "@shared/mailchimp/models/SubscriptionResult";
import ApiError from "@shared/ApiError";


interface MailchimpAuth {
    username: string,
    password: string,
}

/**
 * Get the hashed version of the user's email, which is used as the id for the mailchip amp
 * see: https://developer.mailchimp.com/documentation/mailchimp/guides/manage-subscribers-with-the-mailchimp-api/
 * @param {string} email
 * @return {string}
 */
export function getMemberIdFromEmail(email: string): string {
    const hashed = md5(email.toLowerCase().trim());
    return hashed;
}

export default class MailchimpService {
    apiKey: string;
    apiDomain: string;
    request: AxiosInstance;
    audienceId?: string;

    protected static sharedInstance: MailchimpService;

    static initialize(apiKey: string, audienceId: string | undefined) {
        console.log("initializing mailchimp service");
        MailchimpService.sharedInstance = new MailchimpService(apiKey, audienceId);
    }

    static getSharedInstance() {
        if (MailchimpService.sharedInstance) {
            return MailchimpService.sharedInstance;
        }
        throw new Error("You must initialize mailchimp service before calling sharedInstance()");
    }


    constructor(apiKey: string, audienceId: string | undefined) {
        this.apiKey = apiKey;
        this.audienceId = audienceId;
        const split = this.apiKey.split("-");
        const datacenter = split[split.length - 1] || "";

        this.apiDomain = `https://${datacenter}.api.mailchimp.com/3.0`;

        this.request = axios.create({baseURL: this.apiDomain});
        this.request.interceptors.request.use(config => {
            config.auth = this.getAuthConfig();
            return config;
        });
    }

    getAuthConfig(): MailchimpAuth {
        return {username: `cactus`, password: this.apiKey}
    }

    private getCampaignURL(id: string): string {
        return `/campaigns/${id}`;
    }

    protected getMemberUrlForEmail(email: string): string {
        const id = getMemberIdFromEmail(email);
        return `/lists/${this.audienceId}/members/${id}`;
    }

    async searchCampaigns(query: string, options: GetCampaignsOptions = getDefaultCampaignFetchOptions()): Promise<CampaignSearchResultListResponse> {
        const url = `/search-campaigns`;
        const response = await this.request.get(url, {
            params: {
                ...options.pagination,
                ...options.params
            }
        });

        return response.data;
    }

    async searchMembers(options: SearchMembersOptions): Promise<SearchMembersResult> {
        const defaults = getSearchMemberOptionsDefaults();
        const params: any = {
            ...defaults,
            ...options
        };

        params.exclude_fields = (params.exclude_fields || [defaults.exclude_fields]).join(",");

        const url = `/search-members`;
        const response = await this.request.get(url, {
            params,
        });

        return response.data;
    }

    async getCampaign(id: string): Promise<Campaign | undefined> {
        try {
            const url = this.getCampaignURL(id);
            const response = await this.request.get(url, {
                params: {
                    exclude_fields: "_links"
                }
            });
            return response.data;
        } catch (error) {
            console.error("failed to get mailchimp campaign for campaign id", id, error);
            return undefined;
        }
    }

    async getCampaigns(options: GetCampaignsOptions = getDefaultCampaignFetchOptions()): Promise<CampaignListResponse> {
        const url = `/campaigns`;

        let exclude_fields = options.params ? options.params.exclude_fields : [] || [];
        const set_exclude_fields = new Set(exclude_fields);
        set_exclude_fields.add("campaigns._links");
        set_exclude_fields.add("_links");
        exclude_fields = Array.from(set_exclude_fields);


        console.log("Get Campaigns exclude fields", exclude_fields);

        // exclude_fields
        const response = await this.request.get(url, {
            params: {
                ...options.pagination,
                ...options.params,
                exclude_fields: exclude_fields.join(","),
            }
        });

        console.log("fetch campaigns config", JSON.stringify(response.config.params, null, 2));

        return response.data;
    }

    async getCampaignsByIds(campaignIds:string[]=[]):Promise<Campaign[]> {
        if (campaignIds.length === 0){
            return [];
        }

        const campaignTasks = campaignIds.map(async (id, index) => {
            return new Promise<Campaign>(resolve => {
                setTimeout(async () => {
                    const campaign = await this.getCampaign(id);
                    resolve(campaign)
                }, 150 * index) //delay to prevent api throttling
            })
        });

        return await Promise.all(campaignTasks);
    }

    async getAllCampaigns(options: GetCampaignsOptions = getDefaultCampaignFetchOptions()): Promise<Campaign[]> {
        // options.
        const pageSize = (options.pagination && options.pagination.count) ? options.pagination.count : defaultPageSize;

        const fetcher = (pagination: PaginationParameters): Promise<CampaignListResponse> => {
            options.pagination = pagination;
            return this.getCampaigns(options)
        };

        const resultMapper = (result: CampaignListResponse) => result.campaigns;

        return this.getAllPaginatedResults(fetcher, resultMapper, pageSize);
    }

    async getCampaignContent(campaignId: string): Promise<CampaignContent | undefined> {
        const url = `/campaigns/${campaignId}/content`;
        try {
            const response = await this.request.get(url, {
                params: {
                    exclude_fields: "_links,archive_html"
                }
            });
            return response.data;
        } catch (e) {
            console.log("Unable to get campaign content", e);
            return;
        }
    }

    async getAudienceSegment(listId: string, segmentId: number): Promise<Segment> {
        const url = `/lists/${listId}/segments/${segmentId}`;
        const response = await this.request.get(url);
        return response.data;
    }

    async getSentTo(campaignId: string, pagination = DEFAULT_PAGINATION) {
        const {offset = DEFAULT_PAGINATION.offset, count = DEFAULT_PAGINATION.count} = pagination;
        const url = `reports/${campaignId}/sent-to`;
        const response = await this.request.get(url, {params: {offset, count}});
        console.log("sent to responses", JSON.stringify(response.data, null, 2));
    }

    async createCampaign(campaign: CreateCampaignRequest): Promise<Campaign> {
        const url = `${this.apiDomain}/campaigns`;
        const response = await this.request.post(url, campaign);

        // console.log("created campaign", JSON.stringify(response.data));
        return response.data;
    }

    async updateCampaign(campaignId: string, campaign: UpdateCampaignRequest): Promise<Campaign> {
        const url = `/campaigns/${campaignId}`;
        const response = await this.request.patch(url, campaign);

        return response.data;
    }

    async updateCampaignContent(campaignId: string | number, content: CampaignContentRequest): Promise<CampaignContent> {
        const url = `${this.apiDomain}/campaigns/${campaignId}/content`;
        const response = await this.request.put(url, content);
        // console.log("updated campaign content", response.data);
        return response.data;
    }

    async getSavedSegments(pagination = DEFAULT_PAGINATION): Promise<SegmentListResponse> {
        const {offset = DEFAULT_PAGINATION.offset, count = DEFAULT_PAGINATION.count} = pagination;
        const url = `${this.apiDomain}/lists/${this.audienceId}/segments`;
        const response = await this.request.get(url, {
            params: {
                offset,
                count,
                type: SegmentType.saved
            }
        });
        return response.data;
    }

    async getTags(pagination = DEFAULT_PAGINATION): Promise<SegmentListResponse> {
        const {offset = DEFAULT_PAGINATION.offset, count = DEFAULT_PAGINATION.count} = pagination;
        const url = `${this.apiDomain}/lists/${this.audienceId}/segments`;
        const response = await this.request.get(url, {
            params: {
                type: SegmentType.static,
                offset,
                count
            }
        });
        return response.data;
    }

    async updateTags(tagRequest: UpdateTagsRequest): Promise<boolean> {
        const memberId = getMemberIdFromEmail(tagRequest.email);
        console.log("Updating member with patch", tagRequest);

        try {
            await this.request.post(`/lists/${this.audienceId}/members/${memberId}`, {
                tags: tagRequest.tags
            });
            return true;
        } catch (error) {
            console.error("failed to update tags", error);
            return false;
        }
    }

    async updateMergeFields(request: UpdateMergeFieldRequest): Promise<boolean> {
        try {
            const url = this.getMemberUrlForEmail(request.email);
            await this.request.patch(url, {
                merge_fields: request.mergeFields
            });
            return true;
        } catch (error) {
            console.error("failed to update member merge tags", error);
            return false;
        }

    }

    async getAllSegments(pageSize = defaultPageSize): Promise<Segment[]> {
        const segments: Segment[] = [];
        let currentOffset = 0;

        let tagResponse: SegmentListResponse | null = null;
        while (!tagResponse || tagResponse.total_items > (currentOffset + pageSize)) {
            tagResponse = await this.getTags({offset: currentOffset, count: pageSize});
            segments.push(...tagResponse.segments);
            currentOffset = segments.length;
        }


        return segments;
    }

    async getTemplates(type: TemplateType | undefined, pagination = DEFAULT_PAGINATION): Promise<TemplateListResponse> {
        const {offset = DEFAULT_PAGINATION.offset, count = DEFAULT_PAGINATION.count} = pagination;
        const url = `${this.apiDomain}/templates`;
        const response = await this.request.get(url, {
            params: {
                sort_field: TemplateSortField.name,
                offset,
                count,
                type: type,
                exclude_fields: ["templates._links"].join(',')
            }
        });
        return response.data;
    }

    async getTemplate(templateId: number): Promise<Template> {
        const url = `${this.apiDomain}/templates/${templateId}`;
        const response = await this.request.get(url, {
            params: {
                exclude_fields: ["templates._links"].join(',')
            }
        });
        return response.data;
    }

    async getAllTemplates(type: TemplateType = TemplateType.user, pageSize = defaultPageSize): Promise<Template[]> {
        return this.getAllPaginatedResults(pagination => this.getTemplates(type, pagination), result => result.templates, pageSize);
    }

    /**
     *
     * @param {string} automationId
     * @return {Promise<AutomationListResponse>}
     */
    async getAutomation(automationId: string): Promise<Automation | null> {
        const url = `/automations/${automationId}`;
        const response = await this.request.get(url, {
            params: {
                exclude_fields: ["_links"].join(',')
            }
        });
        return response.data;
    }

    async getAutomationEmail(workflowId:string, emailId: string): Promise<AutomationEmail|undefined> {
        try {
            const url = `/automations/${workflowId}/emails/${emailId}`;
            const response = await this.request.get(url, {
                params: {
                    exclude_fields: "_links"
                }
            });
            return response.data;
        } catch (e){
            console.error("Failed to get workflow email. WorkflowId = ", workflowId, "emailId =", emailId);
            return;
        }

    }

    async getAutomationEmails(automationWorkflowId:string, pagination=DEFAULT_PAGINATION): Promise<AutomationEmailListResponse>{
        const url = `/automations/${automationWorkflowId}/emails`;
        const response = await this.request.get(url, {
            params: {
                exclude_fields: "emails._links",
                ...pagination
            }
        });
        return response.data;
    }

    async getAllAutomationEmailCampaigns(audienceId?:string, pageSize=defaultPageSize):Promise<Campaign[]> {
        const automationEmails = await this.getAllAutomationEmails(audienceId, pageSize);
        const campaignIds = automationEmails.map(email => {
            return email.id
        });

        return this.getCampaignsByIds(campaignIds);
    }

    async getAllAutomationEmailsForWorkflow(workflowId:string, pageSize=defaultPageSize): Promise<AutomationEmail[]>{
        return this.getAllPaginatedResults(pagination => this.getAutomationEmails(workflowId, pagination), result => result.emails, pageSize);
    }

    async getAutomations(pagination = DEFAULT_PAGINATION): Promise<AutomationListResponse> {
        const url = `/automations`;
        const {offset = DEFAULT_PAGINATION.offset, count = DEFAULT_PAGINATION.count} = pagination;
        const response = await this.request.get(url, {
            params: {
                offset,
                count,
                exclude_fields: ["automations._links"].join(',')
            }
        });
        return response.data;
    }

    async getAllAutomations(pageSize = defaultPageSize): Promise<Automation[]> {
        return this.getAllPaginatedResults(pagination => this.getAutomations(pagination), result => result.automations, pageSize);
    }

    async getAllAutomationEmails(listId?:string, pageSize:number=defaultPageSize):Promise<AutomationEmail[]> {
        try {
            const automations = await this.getAllAutomations(pageSize);
            const automationTasks:Promise<AutomationEmail[]>[] = [];
            automations.forEach(automation => {
                if (!listId || automation.recipients.list_id !== listId) {
                    return;
                }
                const task = new Promise<AutomationEmail[]>(async resolve => {
                    const automationEmails = await this.getAllAutomationEmailsForWorkflow(automation.id, pageSize);
                    resolve(automationEmails);

                });
                automationTasks.push(task)
            });

            const workflowEmailsResponses = await Promise.all(automationTasks);

            const allEmails:AutomationEmail[] = [];
            workflowEmailsResponses.forEach(response => {
                allEmails.push(...response);
            });

            return allEmails;
        } catch (error){
            console.error("Failed to get automation emails", error);
            return []
        }
    }

    async getAudience(audienceId: string): Promise<Audience> {
        const url = `/lists/${audienceId}`;
        const response = await this.request.get(url, {
            params: {
                exclude_fields: ["lists._links"].join(',')
            }
        });
        return response.data;
    }

    async getAudiences(pagination = DEFAULT_PAGINATION): Promise<AudienceListResponse> {
        const url = `/lists`;
        const {offset = DEFAULT_PAGINATION.offset, count = DEFAULT_PAGINATION.count} = pagination;
        const response = await this.request.get(url, {
            params: {
                offset,
                count,
                exclude_fields: ["lists._links"].join(',')
            }
        });
        return response.data;
    }

    async getAllAudiences(pageSize = defaultPageSize): Promise<Audience[]> {
        return this.getAllPaginatedResults(pagination => this.getAudiences(pagination), result => result.lists, pageSize);
    }

    async getAllSavedSegments(pageSize = defaultPageSize): Promise<Segment[]> {
        return this.getAllPaginatedResults((pagination) => this.getSavedSegments(pagination), result => result.segments, pageSize);
    }

    async getAllTags(pageSize = defaultPageSize): Promise<Segment[]> {
        return this.getAllPaginatedResults((pagination) => this.getTags(pagination), (result) => result.segments, pageSize)
    }

    async getAllPaginatedResults<T, R extends ListResponse>(method: (pagination: PaginationParameters) => Promise<R>,
                                                            getValues: (val: R) => T[],
                                                            pageSize = defaultPageSize): Promise<T[]> {
        const results: T[] = [];
        let currentOffset = 0;
        let fetchCount = 0;
        let listResponse: R | null = null;
        while (!listResponse || listResponse.total_items > (currentOffset)) {
            listResponse = await method({offset: currentOffset, count: pageSize});
            fetchCount++;
            const values = getValues(listResponse);
            results.push(...values);
            currentOffset = results.length;
            console.log("fetched ", results.length, "/", listResponse.total_items, "items. # Fetches", fetchCount)
        }

        return results;
    }


    async getCampaignSendChecklist(campaignId: string): Promise<SendChecklist> {
        const url = `/campaigns/${campaignId}/send-checklist`;
        const response = await this.request.get(url,);
        return response.data;
    }

    /**
     * Returns true if the campaign was sent successfully
     * @param {string} campaignId
     * @param {CampaignScheduleBody} config
     * @return {Promise<boolean>} - false if there was a problem schedulign the campaign
     */
    async scheduleCampaign(campaignId: string, config: CampaignScheduleBody): Promise<boolean> {
        const url = `/campaigns/${campaignId}/actions/schedule`;
        try {
            const response = await this.request.post(url, config);
            return response.status === 204
        } catch (e) {
            console.error("Failed to schedule campaign", e);
            return false;
        }
    }

    async getMemberByEmail(email?: string): Promise<ListMember | undefined> {
        if (!email) {
            return undefined;
        }
        const id = getMemberIdFromEmail(email);
        const url = `/lists/${this.audienceId}/members/${id}`;
        try {
            const response = await this.request.get(url);
            return response.data;
        } catch (error) {
            console.warn("Failed to get list member for email", email);
            return undefined;
        }
    }

    async getMemberByUniqueEmailId(uniqueEmailId?: string): Promise<ListMember | undefined> {
        if (!uniqueEmailId) {
            return;
        }

        const url = `/lists/${this.audienceId}/members`;
        const response = await this.request.get(url, {
            params: {
                unique_email_id: uniqueEmailId
            }
        });
        if (response.data && response.data.members) {
            const [member] = response.data.members;
            return member;
        } else {
            return undefined;
        }
    }

    async addSubscriber(subscription: SubscriptionRequest, status = ListMemberStatus.pending): Promise<SubscriptionResult> {
        const member = new ListMember(subscription.email);
        member.status = ListMemberStatus.pending;
        if (subscription.referredByEmail) {
            member.addMergeField(MergeField.REF_EMAIL, subscription.referredByEmail);
        }

        const url = `/lists/${this.audienceId}/members`;

        const result = new SubscriptionResult();
        result.member = member;

        try {
            const response = await this.request.post(url, member);
            console.log("mailchimp response", response.data);
            result.success = true;
            result.status = SubscriptionResultStatus.new_subscriber;
        } catch (error) {
            const apiError = new ApiError();
            if (error && error.response && error.response.data) {
                const data = error.response.data;
                switch (data.title) {
                    case "Member Exists":
                        console.warn("User is already on list. Treating as a successful signup", data)
                        result.success = true;
                        result.status = SubscriptionResultStatus.existing_subscriber;
                        break;
                    case "Invalid Resource":
                        console.warn("unable to sign up user", data);
                        result.success = false;
                        result.status = SubscriptionResultStatus.unknown;
                        apiError.friendlyMessage = data.detail || "Please provide a valid email address.";
                        apiError.code = data.status;
                        apiError.error = error.response.data;
                        break;
                    default:
                        console.error("failed to create new member. Response data", data);
                        apiError.friendlyMessage = "Oops, we're unable to sign you up right now. Please try again later.";
                        apiError.error = error.response.data;
                        apiError.code = data.status;
                        result.success = false;
                        result.status = SubscriptionResultStatus.unknown;
                        break;
                }

            } else {
                console.error("Failed to update mailchimp list", error);
                apiError.code = 500;
                apiError.error = error;
                apiError.friendlyMessage = "An unexpected error occurred. Please try again later";
                result.success = false;
            }
            result.error = apiError;
        }

        return result;
    }
}

