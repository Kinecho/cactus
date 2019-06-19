import axios, {AxiosInstance} from "axios";
import {
    CampaignContentRequest,
    CampaignContentResponse,
    CreateCampaignRequest
} from "@shared/mailchimp/models/CreateCampaignRequest";
import {
    Automation,
    AutomationListResponse,
    Campaign,
    ListResponse,
    Segment,
    SegmentListResponse,
    SegmentType,
    Template,
    TemplateListResponse,
    TemplateSortField,
    TemplateType
} from "@shared/mailchimp/models/MailchimpTypes";

// import * as md5 from "md5";


interface MailchimpAuth {
    username: string,
    password: string,
}


declare type PaginationParameters = {
    count?: number,
    offset?: number
}

const defaultPageSize = 30;
const defaultOffset = 0;

const DEFAULT_PAGINATION: PaginationParameters = {
    count: defaultPageSize,
    offset: defaultOffset,
};

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

        console.log("Created mailchimp service with apiDomain", this.apiDomain);

        this.request = axios.create({baseURL: this.apiDomain});
        this.request.interceptors.request.use(config => {
            config.auth = this.getAuthConfig();
            return config;
        });
    }

    getAuthConfig(): MailchimpAuth {
        return {username: `cactus`, password: this.apiKey}
    }


    // /**
    //  * Get the hashed version of the user's email, which is used as the id for the mailchip amp
    //  * see: https://developer.mailchimp.com/documentation/mailchimp/guides/manage-subscribers-with-the-mailchimp-api/
    //  * @param {string} email
    //  * @return {string}
    //  */
    // getMemberIdFromEmail(email:string):string {
    //     const hashed = md5(email.toLowerCase().trim());
    //     return hashed;
    // }

    // private getListURL(audienceId:string|undefined = this.audienceId):string{
    //     if (!audienceId){
    //         throw new Error("No audience ID was found on the mailchimp service");
    //     }
    //     return `${this.apiDomain}/lists/${audienceId}`;
    // }

    private getCampaignURL(id: string): string {
        return `${this.apiDomain}/campaigns/${id}`;
    }

    async getCampaign(id: string) {
        const url = this.getCampaignURL(id);
        const response = await this.request.get(url);
        console.log("campaign response", JSON.stringify(response.data, null, 2));
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


}

