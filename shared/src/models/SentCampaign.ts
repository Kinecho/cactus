import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import {Campaign, CampaignEventData} from "@shared/mailchimp/models/MailchimpTypes";

export default class SentCampaign extends BaseModel {
    collection = Collection.sentCampaigns;
    campaign?: Campaign;
    webhookEvent?: CampaignEventData;
}