import {Campaign, CampaignEventData} from "@shared/mailchimp/models/MailchimpTypes";
import SentCampaign from "@shared/models/SentCampaign";
import FirestoreService from "@shared/services/AdminFirestoreService";
import {CampaignContent} from "@shared/mailchimp/models/CreateCampaignRequest";

const firestoreService = FirestoreService.getSharedInstance();

export async function saveSentCampaign(campaign:Campaign|null|undefined, webhookData: CampaignEventData, content?:CampaignContent):Promise<SentCampaign|null> {
    const model = new SentCampaign();
    if (!campaign){
        console.error("No campaign given, can't save");
        return null;
    }
    model.campaign = campaign;
    model.content = content;
    model.webhookEvent = webhookData;
    model.id = campaign.id;
    return await firestoreService.save(model);
}