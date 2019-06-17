import axios, {AxiosInstance} from "axios";
// import * as md5 from "md5";


interface MailchimpAuth {
    username: string,
    password: string,
}


export default class MailchimpService {
    apiKey: string;
    apiDomain: string;
    request: AxiosInstance;
    audienceId?:string;

    constructor(apiKey:string, audienceId:string|undefined){
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

    getAuthConfig(): MailchimpAuth{
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

    private getCampaignURL(id:string):string {
        return `${this.apiDomain}/campaigns/${id}`;
    }

    async getCampaign(id: string){
        const url = this.getCampaignURL(id);
        const response = await this.request.get(url);
        console.log("campaign response", JSON.stringify(response.data, null, 2));
    }

    async getSentTo(campaignId: string, count: number = 10, offset: number = 0){
        const url = `reports/${campaignId}/sent-to`;
        const response = await this.request.get(url, {params: {offset, count}});
        console.log("sent to responses", JSON.stringify(response.data, null, 2));
    }

}