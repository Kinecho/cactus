import {Campaign, CampaignEventData} from "@shared/mailchimp/models/MailchimpTypes";
import SentCampaign from "@shared/models/SentCampaign";
import {save} from "@api/services/firestoreService";

export async function saveSentCampaign(campaign:Campaign|null, webhookData: CampaignEventData):Promise<SentCampaign|null> {
    const model = new SentCampaign();
    if (!campaign){
        console.error("No campaign given, can't save");
        return null;
    }
    model.campaign = campaign;
    model.webhookEvent = webhookData;
    model.id = campaign.id;
    return await save(model);
}