import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import {CampaignMemberSendStatus} from "@shared/mailchimp/models/MailchimpTypes";

export enum PromptSendMedium {
    EMAIL_MAILCHIMP = "EMAIL_MAILCHIMP",
    PROMPT_CONTENT = "PROMPT_CONTENT",
    CRON_JOB = "CRON_JOB"
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
}

export interface SentPromptHistoryItem {
    medium: PromptSendMedium,
    sendDate: Date,
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
    memberEmail?:string;
    sendHistory: SentPromptHistoryItem[] = [];
    promptContentEntryId?:string;
}