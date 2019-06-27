import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import {Campaign, CampaignEventData} from "@shared/mailchimp/models/MailchimpTypes";
import {CampaignContent} from "@shared/mailchimp/models/CreateCampaignRequest";

export default class SentCampaign extends BaseModel {
    collection = Collection.sentCampaigns;
    campaign?: Campaign;
    content?: CampaignContent;
    webhookEvent?: CampaignEventData;
}