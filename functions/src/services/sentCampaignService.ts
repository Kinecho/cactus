import {Campaign, CampaignEventData} from "@shared/mailchimp/models/MailchimpTypes";
import SentCampaign from "@shared/models/SentCampaign";
import FirestoreService from "@shared/services/AdminFirestoreService";
import {CampaignContent} from "@shared/mailchimp/models/CreateCampaignRequest";
import AdminReflectionPromptService from "@shared/services/AdminReflectionPromptService";

const firestoreService = FirestoreService.getSharedInstance();
const reflectionPromptService = AdminReflectionPromptService.sharedInstance;

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
    const savedSendCampaign = await firestoreService.save(model);

    try {
        await reflectionPromptService.updateCampaign(campaign);
    } catch (e){
        console.error("Unable to update reflection prompt's campaign", e);
    }

    return savedSendCampaign;
}