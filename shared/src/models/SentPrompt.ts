import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import {CampaignMemberSendStatus} from "@shared/mailchimp/models/MailchimpTypes";

export enum PromptSendMedium {
    EMAIL_MAILCHIMP = "EMAIL_MAILCHIMP",
    EMAIL_SENDGRID = "EMAIL_SENDGRID",
    PROMPT_CONTENT = "PROMPT_CONTENT",
    FREE_FORM = "FREE_FORM",
    CRON_JOB = "CRON_JOB",
    CUSTOM_SENT_PROMPT_TIME = "CUSTOM_SENT_PROMPT_TIME",
    PUSH = "PUSH",
}

export enum SentPromptField {
    cactusMemberId = "cactusMemberId",
    userId = "userId",
    lastSentAt = "lastSentAt",
    firstSentAt = "firstSentAt",
    promptId = "promptId",
    mailchimpMemberId = "mailchimpMemberId",
    sendHistory = "sendHistory",
    memberEmail = "memberEmail",
    completed = "completed",
    completedAt = "completedAt",
}

export interface SentPromptHistoryItem {
    medium: PromptSendMedium,
    sendDate: Date,
    usedMemberCustomTime?: boolean,
    mailchimpCampaignId?: string,
    email?: string,
    phoneNumber?: string,
    mailchimpEmailStatus?: CampaignMemberSendStatus
}

export default class SentPrompt extends BaseModel {
    static Fields = SentPromptField;
    collection = Collection.sentPrompts;
    cactusMemberId?: string;
    userId?: string;
    lastSentAt?: Date;
    firstSentAt?: Date;
    promptId?: string;
    memberEmail?: string;
    sendHistory: SentPromptHistoryItem[] = [];
    promptContentEntryId?: string;
    completed: boolean = false;
    completedAt?: Date;

    containsMedium(medium: PromptSendMedium): boolean {
        return !!this.sendHistory.find(history => history.medium === medium);
    }

}