import { BaseModel, Collection } from "@shared/FirestoreBaseModels";
import { SendgridTemplate } from "@shared/models/EmailLog";
import { DateObject, DateTime } from "luxon";
import { isNull } from "@shared/util/ObjectUtil";

export enum NotificationChannel {
    EMAIL = "EMAIL",
    PUSH = "PUSH",
}

export enum SendStatus {
    NOT_ATTEMPTED = "NOT_ATTEMPTED",
    SENDING = "SENDING",
    SENT = "SENT",
    FAILED = "FAILED",
}

export enum NotificationContentType {
    promptContent = "promptContent",
}

/**
 * The reason the notification was sent.
 */
export enum NotificationType {
    /**
     * A New prompt is available for reflecting
     */
    NEW_PROMPT = "NEW_PROMPT",
}

export type PushNotificationData = {
    title?: string,
    body?: string,
    badgeCount: number,
    data?: { [name: string]: any }
};
export type NotificationData = PushNotificationData | { [name: string]: any };

export enum NotificationField {
    memberId = "memberId",
    lastAttemptedAt = "lastAttemptedAt",
    sentAt = "sentAt",
    uniqueBy = "uniqueBy",
    type = "type",
    contentType = "contentType",
    contentId = "contentId",
    channel = "channel",
    status = "status",
    errorMessage = "errorMessage",
    data = "data",
    sendgridTemplateId = "sendgridTemplateId",
    email = "email",
    fcmTokens = "fcmTokens",
}

interface CreateParams {
    memberId: string,
    type: NotificationType,
    data?: NotificationData,
    contentType?: NotificationContentType,
    contentId?: string,
    uniqueBy?: string,
}

export interface EmailCreateParams extends CreateParams {
    sendgridTemplateId: SendgridTemplate,
    email: string,
    data: NotificationData,
}

export interface PushCreateParams extends CreateParams {
    fcmTokens?: string[],
    email?: string,
    data: PushNotificationData,
}

export interface FindNotificationParams {
    uniqueBy?: string,
    memberId: string,
    type: NotificationType,
    channel: NotificationChannel,
    contentId?: string,
    contentType?: NotificationContentType
}

export default class Notification extends BaseModel {
    collection = Collection.notifications;
    memberId!: string;
    static Fields = NotificationField;

    /**
     * The type of notification. Indicates the reason the notification was sent.
     * Options:
     * - NEW_PROMPT
     */
    type!: NotificationType;

    /**
     * The date the notification was last attempted to be sent. Can be updated if the notification was retried.
     */
    lastAttemptedAt?: Date;

    /**
     * The date the notification was sent to the user. Only present if the send was successful.
     */
    sentAt?: Date;

    /**
     * An optional unique identifier to de-dupe events or find existing events.
     * Example: `2020-06-22`
     */
    uniqueBy?: string;

    /**
     * Optional. The type of content this notification is about
     */
    contentType?: NotificationContentType;

    /**
     * Optional. The unique identifier of the type of content this notification is about.
     */
    contentId?: string;

    /**
     * The channel by which the notification was sent. Options
     * - EMAIL
     * - PUSH
     */
    channel!: NotificationChannel;

    /**
     * The send status of the notification. Possible values:
     * - NOT_ATTEMPTED
     * - SENDING
     * - SENT
     * - FAILED
     */
    status: SendStatus = SendStatus.NOT_ATTEMPTED;

    /**
     * Optional. If there was an error sending, a message about the failure reason.
     */
    errorMessage?: string;

    /**
     * Optional. An object that contains all of the data required to send this message.
     * This is particularly useful for Sendgrid Email templates.
     */
    data?: NotificationData;

    /**
     * The SendGrid dynamic template ID. Only applies when this the channel is EMAIL.
     */
    sendgridTemplateId?: SendgridTemplate;

    /**
     * The email address this message was sent to. Only applies when the channel is EMAIL.
     */
    email?: string;

    /**
     * The FCM push tokens this message was sent to. Only applies when channel is PUSH.
     */
    fcmTokens?: string[];


    /**
     * Get the push notification data for this notification.
     * Only applies when the channel is PUSH. Returns undefined otherwise.
     * @return {PushNotificationData | undefined}
     */
    get pushData(): PushNotificationData | undefined {
        if (this.channel === NotificationChannel.PUSH && !isNull(this.data)) {
            return this.data as PushNotificationData;
        }
        return undefined;
    }

    /**
     * Set the status to SENDING when the messages is going to be sent.
     * @param {Date} lastAttemptedAt
     */
    setSending(lastAttemptedAt: Date = new Date()) {
        this.status = SendStatus.SENDING;
        this.lastAttemptedAt = lastAttemptedAt;
    }

    /**
     * Set the status when the the message fails to send
     * @param {string} message
     */
    setSendFailed(message?: string) {
        this.errorMessage = message;
        this.status = SendStatus.FAILED;
    }

    /**
     * Set the status of the notification to SENT and update the sentAt date;
     * @param {Date} [sentAt = CurrentDate]
     */
    setSendSuccess(sentAt: Date = new Date()) {
        this.status = SendStatus.SENT;
        this.sentAt = sentAt;
    }

    protected static commonInit(channel: NotificationChannel, params: CreateParams): Notification {
        const log = new Notification();
        const { data, memberId, contentType, contentId, uniqueBy, type } = params;
        log.type = type;
        log.memberId = memberId;
        log.channel = channel;
        log.data = data;
        log.contentType = contentType;
        log.contentId = contentId;
        log.data = data;
        if (uniqueBy) {
            log.uniqueBy = uniqueBy;
        }

        return log;
    }

    /**
     * Creates a new EMAIL channel notification.
     * @param {EmailCreateParams}} params
     * @return {Notification}
     */
    static createEmail(params: EmailCreateParams): Notification {
        const log = Notification.commonInit(NotificationChannel.EMAIL, params);
        const { sendgridTemplateId, email, } = params;
        log.sendgridTemplateId = sendgridTemplateId;
        log.email = email;
        return log;
    }

    /**
     * Creates a new PUSH channel notification.
     * @param {PushCreateParams} params
     * @return {Notification}
     */
    static createPush(params: PushCreateParams): Notification {
        const log = Notification.commonInit(NotificationChannel.PUSH, params);
        const { fcmTokens, email } = params;
        log.fcmTokens = fcmTokens;
        log.email = email;
        return log;
    }

    static uniqueByDateObject(dateObject: DateObject): string {
        return DateTime.fromObject(dateObject).toFormat("yyyy-LL-dd");
    }
}