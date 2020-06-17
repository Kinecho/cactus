import CactusMember, { PromptSendTime } from "@shared/models/CactusMember";
import { DateObject } from "luxon";
import PromptContent from "@shared/models/PromptContent";
import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import { SubmitTaskResponse } from "@admin/services/CloudTaskService";

/**
 * An object defining the parameters needed to potentially notify a member of new content.
 * The object will be processed asynchronously on a Task Queue, and retried if it fails.
 * Possible notification types include
 *  - Email
 *  - Push Notification
 */
export interface MemberPromptNotificationTaskParams {
    /**
     * The ID of the member to send prompt notifications to
     */
    memberId?: string;

    /**
     * The {PromptSendTime} that this notification was sent for
     * i.e. the 15 minute interval of the day, in UTC in which the notification should be sent for.
     */
    promptSendTimeUTC: PromptSendTime;
    /**
     * The date object to use when determining the prompt to send
     */
    systemDateObject: DateObject;
}

/**
 * The data needed to send notifications to a member about prompt content
 */
export interface MemberPromptNotificationTaskResult {
    memberId?: string;
    success: boolean;
    retryable?: boolean;
    errorMessage?: string;
    setupInfo?: MemberPromptNotificationSetupInfo;
    pushTaskResponse?: SubmitTaskResponse;
    emailTaskResponse?: SubmitTaskResponse;
}

export interface MemberPromptNotificationSetupInfo {
    member?: CactusMember | null,
    usedCachedMember?: boolean,
    promptContent?: PromptContent | null | undefined,
    errorMessage?: string;
    memberDateObject?: DateObject,
    isSendTime?: boolean,
    usedCachedPromptContent?: boolean,
}

/**
 * The processed data needed to actually send notifications to:
 * - Email
 * - Push
 */
export interface SendMemberPromptNotificationParams {
    memberInfo: {
        id: string,
        email?: string,
        displayName?: string,
        firstName?: string,
        lastName?: string,
        tier: SubscriptionTier
    }
}

export interface NextPromptResult {
    promptContent?: PromptContent | undefined | null,
    cached?: boolean,
    memberDateObject?: DateObject,
    isSendTime?: boolean,
}


export interface SendEmailNotificationParams {
    memberId?: string;
    promptContentEntryId?: string;
}

export interface SendPushNotificationParams {
    memberId?: string;
    promptContentEntryId?: string;
}