import { BaseModel, Collection } from "@shared/FirestoreBaseModels";
import { Campaign } from "@shared/mailchimp/models/MailchimpTypes";
import { AppType } from "@shared/types/DeviceTypes";

export enum Field {
    question = "question",
    campaignIds = "campaignIds",
    campaignWebIds = "campaignWebIds",
    campaign = "campaign",
    campaignStatus = "campaign.status",
    reminderCampaign = "reminderCampaign",
    contentPath = "contentPath",
    baseFileName = "baseFileName",
    sendDate = "sendDate",
    promptContentEntryId = "promptContentEntryId",
    memberId = "memberId",
    promptType = "promptType",
    sourceApp = "sourceApp",
    shared = "shared",
}

export enum PromptType {
    FREE_FORM = "FREE_FORM",
    CACTUS = "CACTUS"
}

export default class ReflectionPrompt extends BaseModel {
    static Field = Field;
    readonly collection = Collection.reflectionPrompt;
    question?: string;
    protected campaignIds: string[] = [];
    protected campaignWebIds: string[] = [];
    campaign?: Campaign;
    reminderCampaign?: Campaign;
    contentPath?: string;
    baseFileName?: string;
    sendDate?: Date;
    topic?: string;
    promptContentEntryId?: string;

    /**
     * The Member ID if the prompt was created by a user as a free-form prompt
     */
    memberId?: string;
    promptType?: PromptType = PromptType.CACTUS;
    sourceApp?: AppType;
    shared?: boolean = false;

    prepareForFirestore(): any {
        this.campaignIds = [];
        this.campaignWebIds = [];
        if (this.campaign) {
            this.campaignIds.push(this.campaign.id);
            this.campaignWebIds.push(this.campaign.web_id);
        }
        if (this.reminderCampaign) {
            this.campaignIds.push(this.reminderCampaign.id);
            this.campaignWebIds.push(this.reminderCampaign.web_id);
        }
        return this;
    }

    static createFreeForm(params: {
        memberId: string,
        question?: string | null | undefined,
        topic?: string | undefined,
        app?: AppType
    }): ReflectionPrompt {
        const { memberId, question, topic, app } = params;
        const prompt = new ReflectionPrompt();
        prompt.promptType = PromptType.FREE_FORM;
        prompt.memberId = memberId;
        prompt.question = question ?? undefined;
        prompt.sendDate = new Date();
        prompt.topic = topic;
        prompt.sourceApp = app;
        return prompt;
    }

}