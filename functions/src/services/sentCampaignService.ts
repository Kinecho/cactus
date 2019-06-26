import {Campaign, CampaignEventData} from "@shared/mailchimp/models/MailchimpTypes";
import SentCampaign from "@shared/models/SentCampaign";
import FirestoreService from "@shared/services/AdminFirestoreService";

const firestoreService = FirestoreService.getSharedInstance();

export async function saveSentCampaign(campaign:Campaign|null|undefined, webhookData: CampaignEventData):Promise<SentCampaign|null> {
    const model = new SentCampaign();
    if (!campaign){
        console.error("No campaign given, can't save");
        return null;
    }
    model.campaign = campaign;
    model.webhookEvent = webhookData;
    model.id = campaign.id;
    return await firestoreService.save(model);
}