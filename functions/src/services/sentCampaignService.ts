import {Campaign, CampaignEventData} from "@shared/mailchimp/models/MailchimpTypes";
import SentCampaign from "@shared/models/SentCampaign";
import FirestoreService from "@shared/services/AdminFirestoreService";
import {CampaignContent} from "@shared/mailchimp/models/CreateCampaignRequest";
import AdminReflectionPromptService from "@shared/services/AdminReflectionPromptService";

const firestoreService = FirestoreService.getSharedInstance();
const reflectionPromptService = AdminReflectionPromptService.getSharedInstance();

export async function saveSentCampaign(campaign: Campaign | null | undefined, webhookData: CampaignEventData, content?: CampaignContent): Promise<SentCampaign | undefined> {
    try {
        if (!campaign) {
            console.error("No campaign given, can't save");
            return;
        }
        const model = new SentCampaign();
        const prompt = await reflectionPromptService.updateCampaign(campaign);

        model.campaign = campaign;
        model.content = content;
        model.webhookEvent = webhookData;
        model.id = campaign.id;
        model.reflectionPromptId = prompt ? prompt.id : undefined;

        const savedSendCampaign = await firestoreService.save(model);

        return savedSendCampaign;
    } catch (e) {
        console.error("Unable to update reflection prompt's campaign", e);
        return;
    }


}