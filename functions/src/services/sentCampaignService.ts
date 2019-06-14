import {Campaign, CampaignEventData} from "@shared/mailchimp/models/MailchimpTypes";
import SentCampaign from "@shared/models/SentCampaign";
import {save} from "@api/services/firestoreService";

export async function saveSentCampaign(campaign:Campaign|null, webhookData: CampaignEventData):Promise<SentCampaign> {
    const model = new SentCampaign();
    if (campaign){
        model.campaign = campaign;
    }
    model.webhookEvent = webhookData;
    return await save(model);
}