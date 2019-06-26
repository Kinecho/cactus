import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import {Campaign} from "@shared/mailchimp/models/MailchimpTypes";

export enum Field {
    question = "question",
    campaignIds = "campaignIds",
    campaignWebIds = "campaignWebIds",
    campaign = "campaign",
    reminderCampaign = "reminderCampaign",
    contentPath = "contentPath",
    baseFileName = "baseFileName",
}


export default class ReflectionPrompt extends BaseModel {
    readonly collection = Collection.reflectionPrompt;
    question?:string;
    protected campaignIds:string[] = [];
    protected campaignWebIds:string[] = [];
    campaign?:Campaign;
    reminderCampaign?:Campaign;
    contentPath?:string;
    baseFileName?:string;

    prepareForFirestore(): any {
        this.campaignIds = [];
        this.campaignWebIds = [];
        if (this.campaign){
            this.campaignIds.push(this.campaign.id);
            this.campaignWebIds.push(this.campaign.web_id);
        }
        if (this.reminderCampaign) {
            this.campaignIds.push(this.reminderCampaign.id);
            this.campaignWebIds.push(this.reminderCampaign.web_id);
        }
        return this;
    }
}