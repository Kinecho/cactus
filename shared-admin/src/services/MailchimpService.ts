import axios, {AxiosError, AxiosInstance} from "axios";
import {
    CampaignContent,
    CampaignContentRequest,
    CreateCampaignRequest,
    UpdateCampaignRequest
} from "@shared/mailchimp/models/CreateCampaignRequest";
import {
    Audience,
    AudienceListResponse,
    Automation,
    AutomationEmail,
    AutomationEmailListResponse,
    AutomationListResponse,
    BatchCreateResponse,
    BatchOperation,
    BatchOperationsRequest,
    Campaign,
    CampaignListResponse,
    CampaignScheduleBody,
    CampaignSearchResultListResponse,
    CampaignSentToListResponse,
    DEFAULT_PAGINATION,
    defaultPageDelay,
    defaultPageSize,
    GetCampaignsOptions,
    getDefaultCampaignFetchOptions,
    GetListMembersOptions,
    getSearchMemberOptionsDefaults,
    ListMember,
    ListMemberListResponse,
    ListMemberStatus,
    ListResponse,
    MailchimpApiError,
    MemberActivityListResponse,
    MemberUnsubscribeReport,
    MergeField, OperationStatus,
    PaginationParameters,
    SearchMembersOptions,
    SearchMembersResult,
    Segment,
    SegmentListResponse,
    SegmentMemberListResponse,
    SegmentType,
    SendChecklist,
    SentToRecipient,
    TagResponseError,
    Template,
    TemplateListResponse,
    TemplateSortField,
    TemplateType,
    UpdateMergeFieldRequest,
    UpdateMergeFieldResponse,
    UpdateTagResponse,
    UpdateTagsRequest
} from "@shared/mailchimp/models/MailchimpTypes";
import MailchimpListMember from "@shared/mailchimp/models/MailchimpListMember";
import CactusMember from "@shared/models/CactusMember";
import * as md5 from "md5";
import SignupRequest from "@shared/mailchimp/models/SignupRequest";
import MailchimpSubscriptionResult, {SubscriptionResultStatus} from "@shared/mailchimp/models/SubscriptionResult";
import ApiError from "@shared/api/ApiError";
import {CactusConfig} from "@shared/CactusConfig";
import {UpdateStatusRequest, UpdateStatusResponse} from "@shared/mailchimp/models/UpdateStatusTypes";
import Logger from "@shared/Logger";
import {chunkArray} from "@shared/util/ObjectUtil";

const logger = new Logger("MailchimpService");

interface BatchCreateResult {
    timedOut: boolean,
    response?: BatchCreateResponse | undefined
}

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

    static initialize(config: CactusConfig) {
        logger.log("initializing mailchimp service");
        MailchimpService.sharedInstance = new MailchimpService(config.mailchimp.api_key, config.mailchimp.audience_id);
    }

    static getSharedInstance() {
        if (MailchimpService.sharedInstance) {
            return MailchimpService.sharedInstance;
        }
        throw new Error("You must initialize mailchimp service before calling getSharedInstance()");
    }


    constructor(apiKey: string, audienceId: string | undefined) {
        this.apiKey = apiKey;
        this.audienceId = audienceId;
        const split = this.apiKey.split("-");
        const datacenter = split[split.length - 1] || "";

        this.apiDomain = `https://${datacenter}.api.mailchimp.com/3.0`;

        this.request = axios.create({baseURL: this.apiDomain, timeout: 5000});
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

    async getMembers(options: GetListMembersOptions = {}, pagination = DEFAULT_PAGINATION): Promise<ListMemberListResponse> {
        const url = `/lists/${this.audienceId}/members`;
        const response = await this.request.get(url, {
            params: {
                ...pagination,
                ...options,
                exclude_fields: "members._links,_links"
            }
        });

        return response.data;
    }

    async archiveMember(email: string): Promise<any> {
        const url = `/lists/${this.audienceId}/members/${getMemberIdFromEmail(email)}`;
        try {
            const response = await this.request.delete(url, {
                params: {
                    exclude_fields: "members._links,_links"
                }
            });

            return response.data;
        } catch (e) {
            if (e.isAxiosError) {
                const err = e as AxiosError;
                return err.response && err.response.data
            }
            return "Unable to delete member from mailchimp"
        }

    }

    async deleteMemberPermanently(email: string): Promise<any | { error: any }> {
        const url = `/lists/${this.audienceId}/members/${getMemberIdFromEmail(email)}/actions/delete-permanent`;
        try {
            const response = await this.request.post(url, {
                params: {
                    exclude_fields: "members._links,_links"
                }
            });

            return response.data || "success";
        } catch (e) {
            if (e.isAxiosError) {
                const err = e as AxiosError;
                return {error: err.response && err.response.data}
            }
            return {error: "Unable to delete member from mailchimp"}
        }

    }


    async getAllMembers(options?: GetListMembersOptions, pageSize = defaultPageSize, pageDelay = 0, onPageValues?: (members: ListMember[]) => Promise<void>): Promise<ListMember[]> {
        return this.getAllPaginatedResults(pagination => this.getMembers(options, pagination), response => response.members, pageSize, pageDelay, onPageValues)
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
            if (error.isAxiosError) {
                const axiosError = error as AxiosError;
                logger.error(`${axiosError.code}: failed to get mailchimp campaign for campaignId=${id}. ${axiosError.response ? JSON.stringify(axiosError.response.data) : "no data found"}`);
            } else {
                logger.error("failed to get mailchimp campaign for campaign id", id, error);
            }

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

        const fields = (options.params && options.params.fields) ? options.params.fields.join(",") : undefined;

        const queryParams: any = {
            ...options.pagination,
            ...options.params,
        };

        if (fields) {
            queryParams.fields = fields;
            logger.log("Get Campaigns with Fields = ", fields);
        } else if (exclude_fields.length > 0) {
            logger.log("Get Campaigns exclude fields", exclude_fields);
            queryParams.exclude_fields = exclude_fields.join(",");
        }

        // exclude_fields
        const response = await this.request.get(url, {
            params: queryParams,
        });

        logger.log("fetch campaigns config", JSON.stringify(response.config.params, null, 2));

        return response.data;
    }

    async getCampaignsByIds(campaignIds: string[] = [], delay = 150): Promise<Campaign[]> {
        if (campaignIds.length === 0) {
            return [];
        }

        const campaignTasks = campaignIds.map(async (id, index) => {
            return new Promise<Campaign>(resolve => {
                setTimeout(async () => {
                    const campaign = await this.getCampaign(id);
                    resolve(campaign)
                }, delay * index) //delay to prevent api throttling
            })
        });

        return await Promise.all(campaignTasks);
    }

    async getAllCampaigns(options: GetCampaignsOptions = getDefaultCampaignFetchOptions(), delay: number = 200): Promise<Campaign[]> {
        // options.
        const pageSize = (options.pagination && options.pagination.count) ? options.pagination.count : defaultPageSize;

        const fetcher = (pagination: PaginationParameters): Promise<CampaignListResponse> => {
            options.pagination = pagination;
            return this.getCampaigns(options)
        };

        const resultMapper = (result: CampaignListResponse) => result.campaigns;

        return this.getAllPaginatedResults(fetcher, resultMapper, pageSize, delay);
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
            logger.log("Unable to get campaign content", e);
            return;
        }
    }

    async getAudienceSegmentMembers(segmentId: string, pagination = DEFAULT_PAGINATION): Promise<SegmentMemberListResponse> {
        const {offset = DEFAULT_PAGINATION.offset, count = DEFAULT_PAGINATION.count} = pagination;
        const url = `/lists/${this.audienceId}/segments/${segmentId}/members`;
        const response = await this.request.get(url, {
            params: {
                offset,
                count,
                exclude_fields: "members._links, _links"
            }
        });
        return response.data;
    }

    async getAllAudienceSegmentMembers(segmentId: string, options: {
        pageSize?: number,
        delayMs?: number,
        onPage?: (values: ListMember[]) => Promise<void>
    } = {}): Promise<ListMember[]> {

        const pageSize = options.pageSize || defaultPageSize;
        const delayMs = options.pageSize || defaultPageDelay;

        return this.getAllPaginatedResults(pagination => this.getAudienceSegmentMembers(segmentId, pagination),
            (membersResponse: SegmentMemberListResponse) => membersResponse.members,
            pageSize,
            delayMs,
            options.onPage,)
    }


    async getAudienceSegment(listId: string, segmentId: number): Promise<Segment> {
        const url = `/lists/${listId}/segments/${segmentId}`;
        const response = await this.request.get(url);
        return response.data;
    }

    async getSentTo(campaignId: string, pagination = DEFAULT_PAGINATION): Promise<CampaignSentToListResponse> {
        const {offset = DEFAULT_PAGINATION.offset, count = DEFAULT_PAGINATION.count} = pagination;
        const url = `reports/${campaignId}/sent-to`;
        const response = await this.request.get(url, {
            params: {
                offset,
                count,
                exclude_fields: "_links,sent_to._links"
            }
        });
        return response.data;
    }

    async getAllSentTo(campaignId: string, options: {
        pageSize?: number,
        delayMs?: number,
        onPage?: (values: SentToRecipient[], pageNumber?: number) => Promise<void>
    } = {}): Promise<SentToRecipient[]> {

        const pageSize = options.pageSize || defaultPageSize;
        const delayMs = options.pageSize || defaultPageDelay;

        return this.getAllPaginatedResults(pagination => this.getSentTo(campaignId, pagination),
            (listResponse: CampaignSentToListResponse) => listResponse.sent_to,
            pageSize,
            delayMs,
            options.onPage,)
    }

    async createCampaign(campaign: CreateCampaignRequest): Promise<Campaign> {
        const url = `${this.apiDomain}/campaigns`;
        const response = await this.request.post(url, campaign);

        // logger.log("created campaign", JSON.stringify(response.data));
        delete response.data._links;
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
        // logger.log("updated campaign content", response.data);
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


    /**
     * Submit up to 500 bulk requests
     * @param {UpdateMergeFieldRequest[]} mergeRequests
     * @return {Promise<BatchCreateResponse>}
     */
    async bulkUpdateMergeFields(mergeRequests: UpdateMergeFieldRequest[]): Promise<BatchCreateResponse[]> {
        const chunks = chunkArray(mergeRequests, 500);
        const batchTasks: Promise<BatchCreateResponse>[] = chunks.map(batchRequests => {
            const operations: BatchOperation[] = batchRequests.map(mergeRequest => {
                return {
                    method: "PATCH",
                    path: this.getMemberUrlForEmail(mergeRequest.email),
                    body: {
                        merge_fields: mergeRequest.mergeFields
                    }
                }
            });

            const job: BatchOperationsRequest = {
                operations,
            };
            return this.submitBatchJob(job);
        });
        logger.info(`bulkUpdateMergeFields: Submitted ${batchTasks.length}`);

        return Promise.all(batchTasks);
    }

    async bulkUpdateTags(tagRequests: UpdateTagsRequest[]): Promise<BatchCreateResponse> {
        const operations: BatchOperation[] = tagRequests.map(t => {
            return {
                method: "POST",
                path: `/lists/${this.audienceId}/members/${getMemberIdFromEmail(t.email)}/tags`,
                body: {
                    tags: t.tags,
                }
            }
        });

        const job: BatchOperationsRequest = {
            operations,
        };


        return this.submitBatchJob(job);
    }

    async getBatchStatus(batch: BatchCreateResponse): Promise<BatchCreateResponse> {
        const url = `/batches/${batch.id}`;
        const response = await this.request.get(url);
        return response.data;
    }

    async submitBatchJob(job: BatchOperationsRequest): Promise<BatchCreateResponse> {
        const url = `/batches`;

        job.operations.forEach(op => {
            if (typeof op.body !== "string") {
                op.body = JSON.stringify(op.body);
            }
        });

        const response = await this.request.post(url, job);
        return response.data;
    }

    async waitForBatch(batchResponse: BatchCreateResponse): Promise<BatchCreateResult> {
        const checkInterval = 2000;
        return new Promise<BatchCreateResult>(async (resolve) => {
            let status = batchResponse.status;
            let checkCount = 0;
            let completedBatch: BatchCreateResponse | undefined = undefined;
            const timeoutLimit = 60 * 5 * 1000;
            //using a while loop will pause execution in-line, so once the while loop finishes, we will have waited for the response
            while (status !== OperationStatus.finished || (checkCount * checkInterval) > timeoutLimit) {
                await new Promise((innerResolve) => {
                    setTimeout(async () => {
                        // logger.log("Checking for batch status");
                        completedBatch = await MailchimpService.getSharedInstance().getBatchStatus(batchResponse);
                        // logger.log("Batch status check returned status", completedBatch.status);
                        checkCount++;
                        status = completedBatch.status;
                        innerResolve();
                    }, checkInterval)
                })

            }
            const didTimeOut = checkCount * checkInterval > timeoutLimit && status !== OperationStatus.finished;
            resolve({timedOut: didTimeOut, response: completedBatch});
            return;
        });
    }

    async waitForBatchJobs(jobs: BatchCreateResponse[]): Promise<BatchCreateResult[]> {
        return await Promise.all(jobs.map(job => this.waitForBatch(job)));
    }

    async updateMemberStatus(updateRequest: UpdateStatusRequest): Promise<UpdateStatusResponse> {
        const memberId = getMemberIdFromEmail(updateRequest.email);
        logger.log("Updating member status with patch", updateRequest);

        try {
            const response = await this.request.patch(`/lists/${this.audienceId}/members/${memberId}?exclude_fields=_links`, {
                status: updateRequest.status
            });

            const listMember: ListMember = response.data;

            return {success: true, listMember: listMember};
        } catch (error) {
            const axiosError = error as AxiosError;
            if (axiosError.response) {
                logger.error("failed to update status", error.response);
                return {success: false, error: error.response.data}
            } else {
                logger.error("Unknown error while updating member status", error);
                return {success: false, error: error};
            }
        }
    }


    async updateTags(tagRequest: UpdateTagsRequest): Promise<UpdateTagResponse> {
        const memberId = getMemberIdFromEmail(tagRequest.email);
        logger.log("Updating member with patch", tagRequest);

        try {
            //this just returns a 204 or an error
            await this.request.post(`/lists/${this.audienceId}/members/${memberId}/tags`, {
                tags: tagRequest.tags
            });

            return {success: true};
        } catch (error) {
            const axiosError = error as AxiosError;
            if (axiosError.response) {
                logger.error("failed to update tags", error.response);
                const errorData = error.response.data as TagResponseError;
                return {success: false, error: errorData}
            } else {
                logger.error("Unknown error while updating tags", error);
                return {success: false, unknownError: error};
            }
        }
    }

    async updateMergeFields(request: UpdateMergeFieldRequest): Promise<UpdateMergeFieldResponse> {
        try {
            const url = this.getMemberUrlForEmail(request.email);
            await this.request.patch(url, {
                merge_fields: request.mergeFields
            });
            return {success: true};
        } catch (error) {
            const axiosError = error as AxiosError;
            if (axiosError.response) {
                logger.error("failed to update merge fields", error.response);
                const errorData = error.response.data as TagResponseError;
                return {success: false, error: errorData}
            } else {
                logger.error("Unknown error while updating merge fields", error);
                return {success: false, unknownError: error};
            }
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

    async getAutomationEmail(workflowId: string, emailId: string): Promise<AutomationEmail | undefined> {
        try {
            const url = `/automations/${workflowId}/emails/${emailId}`;
            const response = await this.request.get(url, {
                params: {
                    exclude_fields: "_links"
                }
            });
            return response.data;
        } catch (e) {
            logger.error("Failed to get workflow email. WorkflowId = ", workflowId, "emailId =", emailId);
            return;
        }

    }

    async getAutomationEmails(automationWorkflowId: string, pagination = DEFAULT_PAGINATION): Promise<AutomationEmailListResponse> {
        const url = `/automations/${automationWorkflowId}/emails`;
        const response = await this.request.get(url, {
            params: {
                exclude_fields: "emails._links",
                ...pagination
            }
        });
        return response.data;
    }

    async getAllAutomationEmailCampaigns(audienceId?: string, pageSize = defaultPageSize, delay: number = 200): Promise<Campaign[]> {
        const automationEmails = await this.getAllAutomationEmails(audienceId, pageSize, delay);
        const campaignIds = automationEmails.map(email => {
            return email.id
        });

        return this.getCampaignsByIds(campaignIds, delay);
    }

    async getAllAutomationEmailsForWorkflow(workflowId: string, pageSize = defaultPageSize, delay?: number): Promise<AutomationEmail[]> {
        return this.getAllPaginatedResults(pagination => this.getAutomationEmails(workflowId, pagination), result => result.emails, pageSize, delay);
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

    async getAllAutomationEmails(listId?: string, pageSize: number = defaultPageSize, delay?: number): Promise<AutomationEmail[]> {
        try {
            const automations = await this.getAllAutomations(pageSize);
            const automationTasks: Promise<AutomationEmail[]>[] = [];
            automations.forEach(automation => {
                if (!listId || automation.recipients.list_id !== listId) {
                    return;
                }
                const task = new Promise<AutomationEmail[]>(async resolve => {
                    const automationEmails = await this.getAllAutomationEmailsForWorkflow(automation.id, pageSize, delay);
                    resolve(automationEmails);

                });
                automationTasks.push(task)
            });

            const workflowEmailsResponses = await Promise.all(automationTasks);

            const allEmails: AutomationEmail[] = [];
            workflowEmailsResponses.forEach(response => {
                allEmails.push(...response);
            });

            return allEmails;
        } catch (error) {
            logger.error("Failed to get automation emails", error);
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

    async getUnsubscribeReportForMember(options: { campaignId: string, email: string }): Promise<MemberUnsubscribeReport | undefined> {
        const url = `/reports/${options.campaignId}/unsubscribed/${getMemberIdFromEmail(options.email)}`;
        try {
            const response = await this.request.get(url, {
                params: {
                    exclude_fields: "_links"
                }
            });
            return response.data;
        } catch (error) {
            if (error.isAxiosError) {
                const e = error as AxiosError<MailchimpApiError>;
                if (e.response && e.response.data) {
                    logger.error(`${e.response.data.title}: ${e.response.data.detail}`, e)
                } else {
                    logger.error("Failed to get unsubscribe reason", e);
                }

            }

            return undefined;
        }

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
                                                            pageSize = defaultPageSize,
                                                            pageDelay = 0,
                                                            onPageResults?: (values: T[], pageNumber: number) => Promise<void>): Promise<T[]> {
        const results: T[] = [];
        let currentOffset = 0;
        let fetchCount = 0;
        let listResponse: R | null = null;
        let pageNumber = 0;
        while (!listResponse || listResponse.total_items > (currentOffset)) {
            listResponse = await method({offset: currentOffset, count: pageSize});
            fetchCount++;
            const values = getValues(listResponse);

            if (onPageResults) {
                await onPageResults(values, pageNumber);
            }

            results.push(...values);
            currentOffset = results.length;
            logger.log("fetched ", results.length, "/", listResponse.total_items, "items. # Fetches", fetchCount)

            if (pageDelay > 0) {
                logger.log(`delaying between pages for ${pageDelay}ms`);
                await new Promise(resolve => {
                    setTimeout(() => {
                        resolve()
                    }, pageDelay)
                })
            }
            pageNumber += 1;
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
     * @param campaignWebId
     * @return {Promise<boolean>} - false if there was a problem scheduling the campaign
     */
    async scheduleCampaign(campaignId: string, config: CampaignScheduleBody, campaignWebId: string): Promise<{ success: boolean, alreadyScheduled: boolean, error?: any }> {
        const url = `/campaigns/${campaignId}/actions/schedule`;
        try {
            logger.log("attempting to schedule campaign with config", config);
            const response = await this.request.post(url, config);
            logger.log(`scheduled campaign successfully. Response Status = ${response.status}`);
            return {success: true, alreadyScheduled: false}
        } catch (e) {
            let alreadyScheduled = false;
            let message = e.message || "Unknown error";
            if (e.isAxiosError) {
                const apiError = e as AxiosError;
                const body = apiError.response?.data || {};
                logger.error("Schedule Campaign Error Data", body);
                alreadyScheduled = (body.detail || "").includes("Cannot schedule an already scheduled campaign");
                const mcErrors = body.errors;
                if (!alreadyScheduled && mcErrors && mcErrors.length > 0) {
                    message = "\nErrors: \n" + mcErrors.map((e: { field: string, message: string }) => `${e.field}: ${e.message}`).join("\n");
                } else {
                    message = JSON.stringify(apiError.response?.data.detail) || message;
                }
            }

            logger.error("Failed to schedule campaign", message);

            return {
                success: false,
                alreadyScheduled: alreadyScheduled,
                error: `Unable to schedule campaign: ${message}\n\nSchedule Config: ${JSON.stringify(config)}\n\nPlease check the mailchimp UI for more details https://us20.admin.mailchimp.com/campaigns/edit?id=${campaignWebId}`
            };
        }
    }

    async unscheduleCampaign(campaign: Campaign): Promise<{ success: boolean, errorMessage?: string }> {
        const url = `/campaigns/${campaign.id}/actions/unschedule`;
        try {
            logger.log("attempting to unschedule campaign");
            const response = await this.request.post(url);
            logger.log(`Successfully unscheduled campaign. Status Code = ${response.status}`);
            return {success: true}
        } catch (e) {
            let message = e.message || "Unknown error";
            if (e.isAxiosError) {
                const apiError = e as AxiosError;
                message = JSON.stringify(apiError.response?.data || message);
            }
            logger.error("Failed to un-schedule campaign", message);
            return {
                success: false,
                errorMessage: `Unable to un-schedule campaign: ${message}.\n\nPlease check the mailchimp UI for more details https://us20.admin.mailchimp.com/campaigns/edit?id=${campaign.web_id}`
            };
        }
    }

    async getMemberByEmail(email?: string | null): Promise<ListMember | undefined> {
        if (!email) {
            return undefined;
        }
        const id = getMemberIdFromEmail(email);
        const url = `/lists/${this.audienceId}/members/${id}`;
        try {
            const response = await this.request.get(url, {
                params: {
                    exclude_fields: "_links"
                }
            });
            return response.data;
        } catch (error) {
            if (error.isAxiosError) {
                const axiosError = error as AxiosError;
                logger.error(`MailchimpService.getmeMemberByEmail | Failed to get list member for email ${email}`, axiosError.response);
            } else {
                logger.error(`Failed to get list member for email ${email}`, error);
            }
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
                unique_email_id: uniqueEmailId,
                exclude_fields: "_links,members._links"
            }
        });
        if (response.data && response.data.members) {
            const [member] = response.data.members;
            return member;
        } else {
            return undefined;
        }
    }

    async addSubscriber(subscription: SignupRequest, status = ListMemberStatus.pending): Promise<MailchimpSubscriptionResult> {
        const listMember = new MailchimpListMember(subscription.email);
        listMember.status = status;
        if (subscription.referredByEmail) {
            listMember.addMergeField(MergeField.REF_EMAIL, subscription.referredByEmail);
            //TODO: Add the subscription tier merge field here
        }

        const url = `/lists/${this.audienceId}/members`;

        const result = new MailchimpSubscriptionResult();

        try {
            const response = await this.request.post(url, listMember);
            logger.log("mailchimp response", response.data);
            result.member = response.data;
            result.success = true;
            result.status = SubscriptionResultStatus.new_subscriber;
        } catch (error) {
            const apiError = new ApiError();
            if (error && error.response && error.response.data) {
                const data = error.response.data;
                switch (data.title) {
                    case "Member Exists":
                        logger.warn("User is already on list. Treating as a successful signup", data);
                        result.success = true;
                        result.status = SubscriptionResultStatus.existing_subscriber;
                        // data
                        break;
                    case "Invalid Resource":
                        logger.warn("unable to sign up user", data);
                        result.success = false;
                        result.status = SubscriptionResultStatus.unknown;
                        apiError.friendlyMessage = data.detail || "Please provide a valid email address.";
                        apiError.code = data.status;
                        apiError.error = error.response.data;
                        break;
                    default:
                        logger.error("failed to create new member. Response data", data);
                        apiError.friendlyMessage = "Oops, we're unable to sign you up right now. Please try again later.";
                        apiError.error = error.response.data;
                        apiError.code = data.status;
                        result.success = false;
                        result.status = SubscriptionResultStatus.unknown;
                        break;
                }

            } else {
                logger.error("Failed to update mailchimp list", error);
                apiError.code = 500;
                apiError.error = error;
                apiError.friendlyMessage = "An unexpected error occurred. Please try again later";
                result.success = false;
            }
            result.error = apiError;
        }

        return result;
    }

    /**
     * This is limited to the last 50 results
     */
    async getMemberActivity(email: string): Promise<MemberActivityListResponse | undefined> {
        try {
            const url = `/lists/${this.audienceId}/members/${getMemberIdFromEmail(email)}/activity`;
            logger.log("fetching activity via", url);
            const response = await this.request.get(url, {
                params: {
                    exclude_fields: "_links",
                    count: 50,
                }
            });

            return response.data;
        } catch (e) {
            const error = e as AxiosError;
            logger.error(`Unable to get member activity for ${email}`, error.response ? {
                config: error.config,
                data: error.response.data
            } : error);
            return undefined;
        }
    }

    needsNameUpdate(member: CactusMember): boolean {
        const mailchimpMember = member.mailchimpListMember;
        const email = member.email || mailchimpMember?.email_address;
        if (!email || !member) {
            return false;
        }

        if (mailchimpMember?.merge_fields[MergeField.FNAME] !== member.firstName || 
            mailchimpMember?.merge_fields[MergeField.LNAME] !== member.lastName) {
            return true;
        }

        return false;
    }

    needsSubscriptionUpdate(member: CactusMember): boolean {
        const mailchimpMember = member.mailchimpListMember;
        const email = member.email || mailchimpMember?.email_address;
        if (!email || !member) {
            return false;
        }

        if (member?.subscription &&
            mailchimpMember?.merge_fields[MergeField.SUB_TIER] !== member.subscription.tier) {
            return true;
        }

        if (member?.subscription?.trial) {
            if (mailchimpMember?.merge_fields[MergeField.TDAYS_LEFT] !== member.daysLeftInTrial.toString() ||
                mailchimpMember?.merge_fields[MergeField.IN_TRIAL] !== (member.isInTrial ? 'YES' : 'NO')) {
                return true;
            }
        }

        return false;
    }
}

