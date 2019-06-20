import axios, {AxiosInstance} from "axios";
import {
    CampaignContentRequest,
    CampaignContentResponse,
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
    DEFAULT_PAGINATION, defaultPageSize, getDefaultCampaignFetchOptions
} from "@shared/mailchimp/models/MailchimpTypes";

// import * as md5 from "md5";


interface MailchimpAuth {
    username: string,
    password: string,
}


export default class MailchimpService {
    apiKey: string;
    apiDomain: string;
    request: AxiosInstance;
    audienceId?: string;

    constructor(apiKey: string, audienceId: string | undefined) {
        this.apiKey = apiKey;
        this.audienceId = audienceId;
        const split = this.apiKey.split("-");
        const datacenter = split[split.length - 1] || "";

        this.apiDomain = `https://${datacenter}.api.mailchimp.com/3.0`;

        this.request = axios.create({baseURL: this.apiDomain});
        this.request.interceptors.request.use(config => {
            config.auth = this.getAuthConfig();
            const params = config.params || {};
            params.exclude_fields = "_links";
            config.params = params;
            return config;
        });
    }

    getAuthConfig(): MailchimpAuth {
        return {username: `cactus`, password: this.apiKey}
    }

    private getCampaignURL(id: string): string {
        return `${this.apiDomain}/campaigns/${id}`;
    }

    async getCampaign(id: string) {
        const url = this.getCampaignURL(id);
        const response = await this.request.get(url);
        console.log("campaign response", JSON.stringify(response.data, null, 2));
    }

    async getCampaigns(options:GetCampaignsOptions=getDefaultCampaignFetchOptions()):Promise<CampaignListResponse>{
        const url = `/campaigns`;
        const response = await this.request.get(url, {
            params: {
                ...options.pagination,
                ...options.params
            }
        });

        return response.data;
    }

    async getAllCampaigns(options:GetCampaignsOptions=getDefaultCampaignFetchOptions()):Promise<Campaign[]> {
        // options.
        const pageSize = (options.pagination && options.pagination.count) ? options.pagination.count : defaultPageSize;

        const fetcher = (pagination:PaginationParameters):Promise<CampaignListResponse> => {
            options.pagination = pagination;
            return this.getCampaigns(options)
        };

        const resultMapper = (result:CampaignListResponse) => result.campaigns;

        return this.getAllPaginatedResults(fetcher, resultMapper, pageSize);
    }

    async getAudienceSegment(listId: string, segmentId: number):Promise<Segment> {
        const url = `/lists/${listId}/segments/${segmentId}`;
        const response = await this.request.get(url);
        return response.data;
    }

    async getSentTo(campaignId: string, pagination=DEFAULT_PAGINATION) {
        const {offset = DEFAULT_PAGINATION.offset, count = DEFAULT_PAGINATION.count} = pagination;
        const url = `reports/${campaignId}/sent-to`;
        const response = await this.request.get(url, {params: {offset, count}});
        console.log("sent to responses", JSON.stringify(response.data, null, 2));
    }

    async createCampaign(campaign: CreateCampaignRequest):Promise<Campaign> {
        const url = `${this.apiDomain}/campaigns`;
        const response = await this.request.post(url, campaign);

        // console.log("created campaign", JSON.stringify(response.data));
        return response.data;
    }

    async updateCampaign(campaignId:string, campaign: UpdateCampaignRequest): Promise<Campaign> {
        const url = `/campaigns/${campaignId}`;
        const response = await this.request.patch(url, campaign);

        return response.data;
    }

    async updateCampaignContent(campaignId: string|number, content: CampaignContentRequest):Promise<CampaignContentResponse> {
        const url = `${this.apiDomain}/campaigns/${campaignId}/content`;
        const response = await this.request.put(url, content);
        // console.log("updated campaign content", response.data);
        return response.data;
    }

    async getSavedSegments(pagination=DEFAULT_PAGINATION): Promise<SegmentListResponse> {
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

    async getTags(pagination=DEFAULT_PAGINATION): Promise<SegmentListResponse> {
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

    async getAllSegments(pageSize=defaultPageSize): Promise<Segment[]> {
        const segments:Segment[] = [];
        let currentOffset = 0;

        let tagResponse:SegmentListResponse|null = null;
        while (!tagResponse || tagResponse.total_items > (currentOffset + pageSize)){
            tagResponse = await this.getTags({offset: currentOffset, count: pageSize});
            segments.push(...tagResponse.segments);
            currentOffset = segments.length;
        }


        return segments;
    }

    async getTemplates(type: TemplateType|undefined, pagination=DEFAULT_PAGINATION): Promise<TemplateListResponse> {
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

    async getTemplate(templateId:number): Promise<Template> {
        const url = `${this.apiDomain}/templates/${templateId}`;
        const response = await this.request.get(url, {
            params: {
                exclude_fields: ["templates._links"].join(',')
            }
        });
        return response.data;
    }

    async getAllTemplates(type: TemplateType=TemplateType.user, pageSize=defaultPageSize):Promise<Template[]>{
        return this.getAllPaginatedResults(pagination => this.getTemplates(type, pagination), result => result.templates, pageSize);
    }

    /**
     *
     * @param {string} automationId
     * @return {Promise<AutomationListResponse>}
     */
    async getAutomation(automationId: string):Promise<Automation|null> {
        const url = `/automations/${automationId}`;
        const response = await this.request.get(url, {
            params: {
                exclude_fields: ["_links"].join(',')
            }
        });
        return response.data;
    }

    async getAutomations(pagination=DEFAULT_PAGINATION):Promise<AutomationListResponse> {
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

    async getAllAutomations(pageSize=defaultPageSize): Promise<Automation[]>{
        return this.getAllPaginatedResults(pagination => this.getAutomations(pagination), result => result.automations, pageSize);
    }

    async getAudience(audienceId:string):Promise<Audience>{
        const url = `/lists/${audienceId}`;
        const response = await this.request.get(url, {
            params: {
                exclude_fields: ["lists._links"].join(',')
            }
        });
        return response.data;
    }

    async getAudiences(pagination=DEFAULT_PAGINATION):Promise<AudienceListResponse> {
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

    async getAllAudiences(pageSize=defaultPageSize): Promise<Audience[]>{
        return this.getAllPaginatedResults(pagination => this.getAudiences(pagination), result => result.lists, pageSize);
    }

    async getAllSavedSegments(pageSize=defaultPageSize):Promise<Segment[]>{
        return this.getAllPaginatedResults((pagination) => this.getSavedSegments(pagination), result => result.segments, pageSize);
    }

    async getAllTags(pageSize=defaultPageSize):Promise<Segment[]>{
        return this.getAllPaginatedResults((pagination) => this.getTags(pagination), (result) => result.segments, pageSize)
    }

    async getAllPaginatedResults<T, R extends ListResponse>(method: (pagination:PaginationParameters) => Promise<R>,
                                                            getValues: (val:R) => T[],
                                                            pageSize=defaultPageSize): Promise<T[]> {
        const results:T[] = [];
        let currentOffset = 0;
        let fetchCount = 0;
        let listResponse:R|null = null;
        while (!listResponse || listResponse.total_items > (currentOffset)){
            listResponse = await method({offset: currentOffset, count: pageSize});
            fetchCount++;
            const values = getValues(listResponse);
            results.push(...values);
            currentOffset = results.length;
            console.log("fetched ", results.length, "/", listResponse.total_items, "items. # Fetches", fetchCount)
        }

        return results;
    }


    async getCampaignSendChecklist(campaignId:string): Promise<SendChecklist> {
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
    async scheduleCampaign(campaignId:string, config: CampaignScheduleBody): Promise<boolean> {
        const url = `/campaigns/${campaignId}/actions/schedule`;
        try {
            const response = await this.request.post(url, config);
            return response.status === 204
        } catch (e){
            console.error("Failed to schedule campaign", e);
            return false;
        }
    }

}

