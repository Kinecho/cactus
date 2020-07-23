import { BaseModel, Collection } from "@shared/FirestoreBaseModels";
import { CampaignMemberSendStatus } from "@shared/mailchimp/models/MailchimpTypes";
import { PromptType } from "@shared/models/ReflectionPrompt";

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
    promptType?: PromptType = PromptType.CACTUS;

    containsMedium(medium: PromptSendMedium): boolean {
        return !!this.sendHistory.find(history => history.medium === medium);
    }

    static getSentPromptId(params: { memberId: string, promptId: string }): string {
        const { memberId, promptId } = params;
        return `${ memberId }_${ promptId }`; //should be deterministic in the case we have a race condition
    }

    static create(params: {
        memberId: string,
        promptId: string,
        memberEmail?: string,
        medium?: PromptSendMedium,
        promptType?: PromptType | null,
        userId?: string,
        createHistoryItem?: boolean,
    }): SentPrompt {
        const currentDate = new Date();
        const sentPrompt = new SentPrompt();
        const { memberId, promptId, createHistoryItem } = params;

        sentPrompt.id = SentPrompt.getSentPromptId({ memberId, promptId });
        sentPrompt.promptType = params.promptType ?? PromptType.CACTUS
        sentPrompt.createdAt = currentDate;
        sentPrompt.firstSentAt = currentDate;
        sentPrompt.lastSentAt = currentDate;
        sentPrompt.promptId = params.promptId;
        sentPrompt.cactusMemberId = params.memberId;
        // sentPrompt.userId = member.userId;
        sentPrompt.memberEmail = params.memberEmail;
        if (createHistoryItem) {
            sentPrompt.sendHistory.push({
                sendDate: currentDate,
                email: params.memberEmail,
                medium: params.medium ?? PromptSendMedium.PROMPT_CONTENT,
            });
        }

        return sentPrompt;
    }
}