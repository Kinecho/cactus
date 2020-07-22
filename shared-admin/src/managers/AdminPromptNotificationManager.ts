import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import CloudTaskService, { SubmitTaskResponse, TaskQueueConfigName } from "@admin/services/CloudTaskService";
import CactusMember, { NotificationStatus, PromptSendTime } from "@shared/models/CactusMember";
import {
    MemberPromptNotificationSetupInfo,
    MemberPromptNotificationTaskParams,
    MemberPromptNotificationTaskResult,
    NextPromptResult,
    SendEmailNotificationParams,
    SendEmailNotificationResult,
    SendPushNotificationParams
} from "@admin/tasks/PromptNotificationTypes";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import Logger from "@shared/Logger"
import AdminSlackService, { ChannelName } from "@admin/services/AdminSlackService";
import { DateObject, DateTime } from "luxon";
import { currentDatePlusSeconds, getSendTimeUTC } from "@shared/util/DateUtil";
import { isSendTimeWindow } from "@shared/util/NotificationUtil";
import HoboCache from "@admin/HoboCache";
import AdminSendgridService from "@admin/services/AdminSendgridService";
import { PromptNotificationEmail } from "@admin/services/SendgridServiceTypes";
import { isBlank } from "@shared/util/StringUtil";
import { isPremiumTier } from "@shared/models/MemberSubscription";
import { buildPromptContentURL } from "@admin/util/StringUtil";
import { CactusConfig } from "@admin/CactusConfig";
import AdminNotificationService from "@admin/services/AdminNotificationService";
import Notification, {
    NotificationChannel,
    NotificationContentType,
    NotificationType,
    PushNotificationData,
    SendStatus
} from "@shared/models/Notification";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import PromptContent from "@shared/models/PromptContent";
import { SendgridTemplate } from "@shared/models/EmailLog";
import { NewPromptNotificationPushResult } from "@admin/PushNotificationTypes";
import PushNotificationService from "@admin/services/PushNotificationService";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import SentPrompt, { PromptSendMedium, SentPromptHistoryItem } from "@shared/models/SentPrompt";
import MailchimpService from "@admin/services/MailchimpService";
import { ListMemberStatus } from "@shared/mailchimp/models/MailchimpTypes";
import { FirestoreErrorCode } from "@shared/types/FirestoreTypes";

const removeMarkdown = require("remove-markdown");
const logger = new Logger("PromptNotificationManager");
const MAX_TRANSACTION_ATTEMPTS = 10;
const LAPSED_INACTIVE_DAYS = 30;

export interface UnsubscribeLapsedMemberResult {
    isLastEmail: boolean,
    unsubscribed: boolean,
}

export default class AdminPromptNotificationManager {

    static shared: AdminPromptNotificationManager;

    static initialize(config: CactusConfig) {
        AdminPromptNotificationManager.shared = new AdminPromptNotificationManager(config);
    }

    config: CactusConfig

    constructor(config: CactusConfig) {
        this.config = config;
    }

    /**
     * The main processing method for sending prompt notifications.
     * This method is intended to be called directly from the cron job handler, every 15 minutes.
     *
     * @param {PromptSendTime} sendTimeUTC - The "send time" that identifies the group of users that should get prompts.
     * These are grouped into 15 minute intervals. Only users that have their settings configured to get notifications
     * in this window will be processed
     *
     * @return {Promise<SubmitTaskResponse[]>}
     */
    async createNotificationTasksForUTCSendTime(sendTimeUTC: PromptSendTime): Promise<{ tasks: SubmitTaskResponse[], emails: string[] }> {
        const taskResults: SubmitTaskResponse[] = []
        const memberEmails: string[] = []
        await AdminCactusMemberService.getSharedInstance().getMembersForUTCSendPromptTimeBatch(sendTimeUTC, {
            onData: async (members, batchNumber) => {
                const startTime = (new Date()).getTime();
                console.log(`Fetched ${ members.length } in batch ${ batchNumber }`);
                const memberBatchResult = await Promise.all(members.map(member => {
                    const memberId = member.id;
                    if (member.email) {
                        memberEmails.push(member.email);
                    }
                    const payload: MemberPromptNotificationTaskParams = {
                        memberId: memberId,
                        promptSendTimeUTC: sendTimeUTC,
                        systemDateObject: DateTime.utc().toObject()
                    }
                    return this.createDailyPromptSetupTask(payload)
                }));
                taskResults.push(...memberBatchResult);
                const endTime = (new Date()).getTime();
                logger.log(`batch finished. Processed ${ memberBatchResult.length } members in batch ${ batchNumber } in ${ endTime - startTime }ms`);
            }
        });
        return { tasks: taskResults, emails: memberEmails };
    }

    /**
     * Create CloudTask httpTask for the given member. The task will then process the individual member's notification(s)
     * @param {MemberPromptNotificationTaskParams} payload - the payload to send to the task
     * @param {Date|undefined} processAt - Optional date in which this task should be processed. If omitted, it will process immediately.
     * @return {SubmitTaskResponse}
     */
    async createDailyPromptSetupTask(payload: MemberPromptNotificationTaskParams, processAt?: Date | undefined): Promise<SubmitTaskResponse> {
        return await CloudTaskService.shared.submitHttpTask({
            queue: TaskQueueConfigName.daily_prompt_setup,
            payload,
            processAt
        });
    }

    async createDailyPromptEmailTask(setupInfo: MemberPromptNotificationSetupInfo, processAt?: Date): Promise<SubmitTaskResponse> {
        const { member, promptContent, memberDateObject, sentPrompt } = setupInfo;

        //This guard is mostly to prevent sending emails to people that already have been sent an email
        const sentPromptMediums: PromptSendMedium[] = sentPrompt?.sendHistory.map(h => h.medium) ?? [];
        const restrictedMediums: PromptSendMedium[] = [
            PromptSendMedium.EMAIL_MAILCHIMP,
            PromptSendMedium.CRON_JOB,
            PromptSendMedium.PROMPT_CONTENT,
            PromptSendMedium.EMAIL_SENDGRID
        ];
        if (sentPromptMediums.some(m => restrictedMediums.includes(m))) {
            return {
                success: true,
                skipped: true,
                message: "Sent prompt included a restricted type - which means they may have been sent the email already."
            }
        }

        if (member?.notificationSettings?.email === NotificationStatus.INACTIVE) {
            logger.info("Not creating email task as the user's email preference is to INACTIVE");
            return {
                success: true,
                skipped: true,
                message: "Member has email notification settings INACTIVE",
            }
        }
        const payload: SendEmailNotificationParams = {
            memberId: member?.id,
            promptContentEntryId: promptContent?.entryId,
            memberSendDate: memberDateObject,
        };
        return await CloudTaskService.shared.submitHttpTask({
            queue: TaskQueueConfigName.daily_prompt_email,
            payload,
            processAt
        });
    }

    async createDailyPromptPushTask(setupInfo: MemberPromptNotificationSetupInfo, processAt?: Date): Promise<SubmitTaskResponse> {
        const { member, promptContent, memberDateObject, sentPrompt } = setupInfo;
        if ((member?.fcmTokens ?? []).length === 0) {
            return {
                success: true,
                skipped: true,
                message: "Member has no FCM tokens. Not sending push notifications",
            }
        }

        //This guard is mostly to prevent sending emails to people that already have been sent an email
        const sentPromptMediums: PromptSendMedium[] = sentPrompt?.sendHistory.map(h => h.medium) ?? [];
        const restrictedMediums: PromptSendMedium[] = [
            PromptSendMedium.PUSH,
        ];
        if (sentPromptMediums.some(m => restrictedMediums.includes(m))) {
            return {
                success: true,
                skipped: true,
                message: "Sent prompt included a restricted type - which means they may have been sent the push already."
            }
        }

        const payload: SendPushNotificationParams = {
            memberId: member?.id,
            promptContentEntryId: promptContent?.entryId,
            memberSendDate: memberDateObject,
        };

        return await CloudTaskService.shared.submitHttpTask({
            queue: TaskQueueConfigName.daily_prompt_push,
            payload,
            processAt
        });
    }


    /**
     * For a given member ID, notify them of the daily new prompts, if needed.
     * This method needs to understand how to prevent sending more than once, as there is no guarantee
     * that it will only be called once for this per per day or new prompt.
     * @param {MemberPromptNotificationTaskParams} params
     * @return {Promise<MemberPromptNotificationTaskResult>}
     */
    async createMemberDailyPromptNotifications(params: MemberPromptNotificationTaskParams): Promise<MemberPromptNotificationTaskResult> {
        const setupInfo = await this.getMemberPromptNotificationSetupInfo(params);
        const success = !!setupInfo.promptContent;
        const errorMessage = setupInfo.errorMessage;
        const result: MemberPromptNotificationTaskResult = {
            memberId: params.memberId,
            success,
            errorMessage,
            retryable: false,
            setupInfo
        }

        if (!success) {
            logger.info("Unable to schedule notifications - the setup intent was not successful", stringifyJSON(setupInfo));
            return result;
        }

        // Note: this assumes that a member should only answer a given PromptContent once, and should not be notified of it again.
        const hasReflections = (setupInfo.reflectionResponses ?? []).length > 0;
        if (hasReflections) {
            logger.info(`Member has ${ [hasReflections && "existing reflections"].filter(Boolean).join(" and ") }. Not sending notifications`);
            result.success = true;
            result.alreadyReflected = hasReflections;
            return result;
        }

        const [emailResult, pushResult] = await Promise.all([
            this.createDailyPromptEmailTask(setupInfo, currentDatePlusSeconds(0)),
            this.createDailyPromptPushTask(setupInfo, currentDatePlusSeconds(2)),
        ])
        const sentPrompt = await this.createSentPromptFromSetupInfo({ setupInfo, pushResult, emailResult });
        result.emailTaskResponse = emailResult;
        result.pushTaskResponse = pushResult;
        result.sentPrompt = sentPrompt

        return result;
    }

    /**
     * Even if no email or push tasks were created, the prompt should still be logged and show up in the user's feed.
     * @param {object} params
     * @param {MemberPromptNotificationSetupInfo} params.setupInfo
     * @param {SubmitTaskResponse} params.pushResult
     * @param {SubmitTaskResponse} params.emailResult
     * @return {Promise<SentPrompt | undefined>}
     */
    async createSentPromptFromSetupInfo(params: { setupInfo: MemberPromptNotificationSetupInfo, pushResult: SubmitTaskResponse, emailResult: SubmitTaskResponse }): Promise<SentPrompt | undefined> {
        const { setupInfo, pushResult, emailResult } = params;
        const { member, promptContent } = setupInfo;
        let sentPrompt = setupInfo.sentPrompt;
        if (member && promptContent && !sentPrompt) {
            const createdResult = AdminSentPromptService.createSentPrompt({
                member,
                promptContent,
            });
            sentPrompt = createdResult.sentPrompt;

            if (!sentPrompt) {
                return undefined;
            }
        }

        if (sentPrompt) {
            const history: SentPromptHistoryItem[] = sentPrompt.sendHistory
            if (pushResult.success && pushResult.task) {
                history.push({ usedMemberCustomTime: true, medium: PromptSendMedium.PUSH, sendDate: new Date() })
            }
            if (emailResult.success && emailResult.task) {
                history.push({
                    usedMemberCustomTime: true,
                    medium: PromptSendMedium.EMAIL_SENDGRID,
                    sendDate: new Date()
                })
            }

            sentPrompt.sendHistory = history;
            await AdminSentPromptService.getSharedInstance().save(sentPrompt);
            return sentPrompt;
        }
        return undefined;
    }

    async getMemberPromptNotificationSetupInfo(params: MemberPromptNotificationTaskParams): Promise<MemberPromptNotificationSetupInfo> {
        const { memberId, systemDateObject } = params;
        const { member, cached: memberCached } = await HoboCache.shared.getMemberById(memberId);

        if (!member) {
            return {
                member,
                usedCachedMember: memberCached,
                errorMessage: `No member was found for memberId ${ memberId }`,
            }
        }

        const { isSendTime, promptContent, memberDateObject, cached: usedCachedPromptContent } = await this.getPromptForMemberForDate({
            member,
            systemDateObject
        });

        /* TODO: Do we need this check anymore? If we trust that this job will only run at the appropriate time, we can remove it
         *  If it's possible that the job could run at times that are not appropriate for the user, we may want to keep this check. */
        if (!isSendTime) {
            logger.warn("It's not currently the member's send time, but will send anyway")
        }

        let errorMessage: string | undefined;
        if (!promptContent) {
            errorMessage = `No "next prompt content" could be found for member ${ member.id } for date ${ memberDateObject ? DateTime.fromObject(memberDateObject).toLocaleString() : "undefined" }`;
        }

        //Check on the current sent prompt status for this user. Do not notify if the prompt is completed
        const [sentPrompt, reflectionResponses] = await Promise.all([AdminSentPromptService.getSharedInstance().getSentPromptForCactusMemberId({
            cactusMemberId: memberId,
            promptId: promptContent?.promptId
        }), AdminReflectionResponseService.getSharedInstance().getMemberResponsesForPromptId({
            memberId, promptId: promptContent?.promptId, limit: 1,
        })]) as [SentPrompt | undefined, ReflectionResponse[]];


        logger.info(`Sending member ${ memberId } prompt entry ${ promptContent?.entryId ?? "[none]" }: "${ promptContent?.subjectLine ?? "[none]" }"`)
        const result = {
            member,
            sentPrompt,
            reflectionResponses,
            usedCachedMember: memberCached,
            isSendTime,
            promptContent,
            memberDateObject,
            usedCachedPromptContent,
            errorMessage,
        }

        const logInfo = {
            ...result,
            member: { id: member.id, email: member.email },
            promptContent: {
                entryId: promptContent?.entryId,
                subjectLine: promptContent?.subjectLine,
            }
        }

        logger.info(`Finished processing prompt notification for member ${ memberId }`, stringifyJSON(logInfo, 2));
        return result;
    }

    /**
     * Given input params and the result params, notify slack of the results.
     * @param {MemberPromptNotificationTaskParams} params
     * @param {MemberPromptNotificationTaskResult} result
     * @param {object} other - any other params to add to the message
     * @return {Promise<void>}
     */
    async notifySlackResults(params: MemberPromptNotificationTaskParams, result: MemberPromptNotificationTaskResult, other?: any) {
        const { memberId } = params;
        const { promptContent: pc, member, ...setupObject } = result.setupInfo ?? {};

        await AdminSlackService.getSharedInstance().uploadTextSnippet({
            message: `:squid: :woman-golfing: \`daily-prompt-setup\` Prompt Notification Setup Completed for MemberId \`${ memberId }\``,
            data: stringifyJSON({
                other,
                params,
                result: {
                    ...result,
                    setupInfo: {
                        ...setupObject,
                        promptContent: {
                            entryId: pc?.entryId,
                            subjectLine: pc?.subjectLine
                        },
                        member: {
                            id: member?.id,
                            email: member?.email,
                        }
                    }
                }
            }, 2),
            filename: `member-${ memberId }-prompt-notification-results.json`,
            fileType: "json",
            channel: ChannelName.engineering,
        })

    }

    /**
     * Convert a given "systemDate" in UTC to the member's local time zone, when possible.
     *
     * @param {DateObject} options.systemDateObject - the date to convert into member's local time
     * @param {CactusMember} options.member - the Member whose timezone will be used to calculate the local date
     * @return {{error?: string, isSendTime?: boolean, memberLocaleDateObject?: DateObject}} - localized timezone object, or an error
     */
    getMemberSendTimeInfo(options: { systemDateObject: DateObject, member: CactusMember }): { error?: string, isSendTime?: boolean, memberLocaleDateObject?: DateObject } {
        const { member, systemDateObject } = options;

        const memberSendTimeUTC = member.promptSendTimeUTC || getSendTimeUTC({
            forDate: new Date(),
            timeZone: member.timeZone,
            sendTime: member.promptSendTime
        });

        if (!memberSendTimeUTC) {
            logger.log(`Member ${ member.email } does not have a preferred send time in UTC. Not processing`);
            return { error: `memberSendTimeUTC not found on member ${ member.email }` };
        }

        const systemJSDate = DateTime.fromObject(systemDateObject).setZone("utc").toJSDate();
        const memberLocaleDateObject = member.getCurrentLocaleDateObject(systemJSDate);
        const isSendTime = isSendTimeWindow({
            currentDate: systemDateObject,
            sendTime: memberSendTimeUTC,
        });

        return { isSendTime, memberLocaleDateObject }
    }


    /**
     * Given a member and a date, determine the "next" prompt a member should receive.
     * Today, this is simply the scheduled daily content,
     * but this could be modified to return a custom prompt for the user
     *
     * @param {object} params;
     * @param {CactusMember} params.member - the Member to fetch the next prompt for
     * @param {DateObject} params.systemDateObject - the date to use when determining what prompt to fetch.
     * This lets us pass in any date to potentially get prompts the user should be sent in the future (or past).
     * @return {Promise<NextPromptResult>}
     */
    async getPromptForMemberForDate(params: { member: CactusMember, systemDateObject: DateObject }): Promise<NextPromptResult> {
        const { member, systemDateObject } = params;
        const { isSendTime, memberLocaleDateObject } = this.getMemberSendTimeInfo({ member, systemDateObject })
        if (!memberLocaleDateObject) {
            logger.warn(`Unable to determine a local date object for member ${ member.id }`);
            return { isSendTime, promptContent: undefined };
        }

        const { promptContent, cached } = await HoboCache.shared.getPromptContentForIsoDateObject(memberLocaleDateObject);

        return { isSendTime, promptContent, memberDateObject: memberLocaleDateObject, cached }
    }

    /**
     * Send an email via SendGrid notifying a user about a new PromptContent available to them.
     * @param {SendEmailNotificationParams} params
     * @return {Promise<SendEmailNotificationResult>}
     */
    async sendPromptNotificationEmail(params: SendEmailNotificationParams): Promise<SendEmailNotificationResult> {
        const { memberId, promptContentEntryId, memberSendDate } = params;
        const { member } = await HoboCache.shared.getMemberById(memberId);
        const email = member?.email;
        const { promptContent } = await HoboCache.shared.fetchPromptContent(promptContentEntryId);
        if (!member || !promptContent || !promptContentEntryId || !memberId || !email || isBlank(email)) {
            return {
                sent: false,
                retryable: false,
                errorMessage: `unable to get both a member and prompt content from data: ${ stringifyJSON(params) }`
            };
        }

        logger.info("Member notification settings: ", stringifyJSON(member?.notificationSettings, 2));

        if (member?.notificationSettings.email === NotificationStatus.INACTIVE) {
            logger.info("Member has opted out of emails, not sending");
            return {
                sent: false,
                message: "User has opted out of emails, not sending",
            }
        }

        const latestResponse = await AdminReflectionResponseService.getSharedInstance().getLatestResponseForMember(memberId);
        const emailData = this.buildEmailNotificationTemplateData({ member, promptContent, latestResponse });
        if (!emailData) {
            return { sent: false, errorMessage: "Unable to build email data for the notification.", retryable: false };
        }

        const notificationResult = await this.getOrCreateEmailNotification({
            member,
            promptContent,
            emailData,
            memberSendDate
        });

        const errorMessage = (notificationResult as { errorMessage: string }).errorMessage
        if (errorMessage) {
            return {
                sent: false,
                errorMessage: errorMessage,
                retryable: true,
            }
        }

        const { notification, existing: notificationExisted } = notificationResult as { notification: Notification, existing: boolean };
        const status = notification?.status;
        const restrictedStatuses: SendStatus[] = [SendStatus.SENDING, SendStatus.SENT];
        if (notificationExisted && status && restrictedStatuses.includes(status)) {
            logger.info("Notification is currently sending or has already sent", stringifyJSON(notification, 2));
            return { sent: false, message: `email notification already exists and status is ${ notification.status }` };
        }

        const sendResult = await AdminSendgridService.getSharedInstance().sendPromptNotification(emailData);

        notification.status = SendStatus.SENT;
        await AdminNotificationService.getSharedInstance().save(notification);

        if (emailData.isLastEmail) {
            logger.info("Unsubscribing user from future emails");
            await this.updateMemberEmailPreference(emailData.email, NotificationStatus.INACTIVE, true);
            await AdminSlackService.getSharedInstance().sendActivityMessage(`Unsubscribing ${ emailData.email } from future notification emails as they have not been active for ${ LAPSED_INACTIVE_DAYS } days or more`);
        }

        return { sent: true, sendResult };
    }

    /**
     * Update the cactus member's notificationPreferences object, and update all email providers.
     * @param {string} email - the email of the user to update email preferences for
     * @param {NotificationStatus} status - the status to update the user to
     * @param {boolean} [isAdminUnsubscribe=false] - if this is an admin unsubscribe action.
     * @return {Promise<void>}
     */
    async updateMemberEmailPreference(email: string, status: NotificationStatus, isAdminUnsubscribe: boolean = false): Promise<void> {
        try {
            if (!email) {
                return;
            }
            const isUnsubscribe = status === NotificationStatus.INACTIVE;
            await AdminCactusMemberService.getSharedInstance().setEmailNotificationPreference(email, !isUnsubscribe, isAdminUnsubscribe);
            logger.info("Updated member status in the DB");

            const mailchimpStatusRequest = {
                status: isUnsubscribe ? ListMemberStatus.unsubscribed : ListMemberStatus.subscribed,
                email,
            }
            const [mailchimpResponse, sendgridResult] = await Promise.all([
                MailchimpService.getSharedInstance().updateMemberStatus(mailchimpStatusRequest),
                AdminSendgridService.getSharedInstance().updateNewPromptNotificationPreference(email, !isUnsubscribe)
            ]);
            logger.info("Mailchimp update user status response", mailchimpResponse);
            logger.info("unsubscribe user from email notifications result", stringifyJSON(sendgridResult, 2));

        } catch (error) {
            logger.error("Failed to update member status",)
        }
    }

    getLapsedDate(from: Date = new Date()): Date {
        return DateTime.fromJSDate(from).minus({ days: LAPSED_INACTIVE_DAYS }).toJSDate();
    }

    isLapsedDate(input: Date): boolean {
        const lapsedCutoffDate = this.getLapsedDate();
        return input < lapsedCutoffDate;
    }

    /**
     * Returns if member has not been active for some {LAPSED_INACTIVE_DAYS} and is still subscribed to emails.
     * If true, then the member should get the current day's email, but no more.
     * @param {CactusMember} member
     * @param {ReflectionResponse} [latestResponse - the last reflection response from this person
     * @return {boolean}
     */
    isLastEmail(member: CactusMember, latestResponse?: ReflectionResponse): boolean {
        if (member.notificationSettings.email === NotificationStatus.INACTIVE) {
            return false
        }

        const adminDate = member.adminEmailUnsubscribedAt;
        let adminLapsed = true;
        if (adminDate) {
            adminLapsed = this.isLapsedDate(adminDate);
        }

        const lastReplyDate = latestResponse?.createdAt ?? member.lastReplyAt;

        //No last reply - user has no reflections
        if (!lastReplyDate) {
            const memberCreatedAt = member.createdAt;
            return (memberCreatedAt && this.isLapsedDate(memberCreatedAt)) ?? false;
        }

        const replyLapsed = this.isLapsedDate(lastReplyDate);

        return replyLapsed && adminLapsed;
    }

    async getOrCreatePushNotification(params: {
        member: CactusMember,
        promptContent: PromptContent,
        data: PushNotificationData,
        memberSendDate?: DateObject,
    }): Promise<{ notification: Notification, existing: boolean } | { errorMessage?: string }> {
        const { member, promptContent, data, memberSendDate } = params;
        try {
            return await AdminFirestoreService.getSharedInstance().firestore.runTransaction<{ notification: Notification, existing: boolean }>(async transaction => {
                const uniqueBy = memberSendDate ? Notification.uniqueByDateObject(memberSendDate) : undefined;
                let existing = false;
                let notification: Notification | undefined = await AdminNotificationService.getSharedInstance().findFirst({
                    uniqueBy,
                    type: NotificationType.NEW_PROMPT,
                    contentType: NotificationContentType.promptContent,
                    contentId: promptContent.entryId,
                    channel: NotificationChannel.PUSH,
                    memberId: member.id!,
                }, {
                    transaction,
                    silentErrorCodes: [FirestoreErrorCode.ABORTED],
                    queryName: `Get existing Notification log for PUSH channel for ${ member.email } `
                })

                if (!notification) {
                    notification = Notification.createPush({
                        memberId: member.id!,
                        email: member.email!,
                        type: NotificationType.NEW_PROMPT,
                        contentType: NotificationContentType.promptContent,
                        contentId: promptContent.entryId,
                        fcmTokens: member.fcmTokens,
                        uniqueBy,
                        data,
                    })
                    notification.status = SendStatus.SENDING; //set to sending because we'll be sending this notification shortly
                    notification = await AdminNotificationService.getSharedInstance().save(notification, {
                        transaction,

                        queryName: `Save new PUSH Notification for ${ member.email } `
                    });
                } else {
                    existing = true;
                    logger.info("Found existing PUSH notification:", stringifyJSON(notification, 2));

                }
                return { notification, existing };
            }, { maxAttempts: MAX_TRANSACTION_ATTEMPTS });
        } catch (error) {
            return { errorMessage: error.message ?? "Unable to execute transaction to find or create PUSH notification. Max transaction attempts exceeded." };
        }
    }


    /**
     * Using Firestore transaction, get existing Notification, or create a new one.
     * @param {object} params
     * @param  {CactusMember} params.member
     * @param {promptContent} params.promptContent
     * @param {emailData} params.emailData
     * @param {[DateObject]} params.memberSendDate
     * @return {Notification}
     */
    async getOrCreateEmailNotification(params: {
        member: CactusMember,
        promptContent: PromptContent,
        emailData: PromptNotificationEmail,
        memberSendDate?: DateObject
    }): Promise<{ notification: Notification, existing: boolean } | { errorMessage: string }> {
        const { member, promptContent, emailData, memberSendDate } = params;
        try {
            return await AdminFirestoreService.getSharedInstance().firestore.runTransaction<{ notification: Notification, existing: boolean }>(transaction => {
                return new Promise<{ notification: Notification, existing: boolean }>(async (resolve, reject) => {
                    try {
                        const uniqueBy = memberSendDate ? Notification.uniqueByDateObject(memberSendDate) : undefined;
                        let existing = false;
                        let notification: Notification | undefined = await AdminNotificationService.getSharedInstance().findFirst({
                            uniqueBy,
                            type: NotificationType.NEW_PROMPT,
                            contentType: NotificationContentType.promptContent,
                            contentId: promptContent.entryId,
                            channel: NotificationChannel.EMAIL,
                            memberId: member.id!,
                        }, {
                            transaction,
                            silentErrorCodes: [FirestoreErrorCode.ABORTED],
                            queryName: `Get existing Notification log for EMAIL channel for ${ member.email }`
                        })

                        if (!notification) {
                            notification = Notification.createEmail({
                                memberId: member.id!,
                                email: member.email!,
                                type: NotificationType.NEW_PROMPT,
                                contentType: NotificationContentType.promptContent,
                                contentId: promptContent.entryId,
                                uniqueBy,
                                data: emailData,
                                sendgridTemplateId: SendgridTemplate.new_prompt_notification,
                            })
                            notification.status = SendStatus.SENDING; //set to sending because we'll be sending this notification shortly
                            notification = await AdminNotificationService.getSharedInstance().save(notification, { transaction });
                        } else {
                            existing = true;
                            logger.info("Found existing EMAIL notification:", stringifyJSON(notification, 2));
                        }
                        resolve({ notification, existing });
                    } catch (error) {
                        if (!(error.code === 10 || error.message?.includes("Too much contention"))) {
                            logger.error("Error executing transaction", error);
                            await AdminSlackService.getSharedInstance().sendDbAlertsMessage(`\`[PromptNotificationManager]\` Error getting/creating Notification for EMAIL\n\`\`\`${ error }\`\`\``);
                        }
                        reject(error);
                    }
                    return;
                })
            }, { maxAttempts: MAX_TRANSACTION_ATTEMPTS });
        } catch (error) {
            logger.error("Failed to execute transaction for getting/creating PUSH Notification", error);
            return { errorMessage: error.message ?? "Failed to execute transaction for getting/creating push notification. Max transaction retries exceeded." }
        }

    }

    buildEmailNotificationTemplateData(params: { member: CactusMember, promptContent: PromptContent, latestResponse?: ReflectionResponse }): PromptNotificationEmail | null {
        const { member, promptContent, latestResponse } = params;
        const introText = removeMarkdown(promptContent.getDynamicPreviewText({ member }) ?? "") as string;
        const promptUrl = buildPromptContentURL(promptContent, this.config);

        if (!promptUrl || !member.id || !member.email) {
            logger.error("Unable to build prompt data");
            return null
        }

        const data: PromptNotificationEmail = {
            email: member.email,
            firstName: member.firstName,
            memberId: member.id,
            promptContentEntryId: promptContent.entryId,
            reflectUrl: promptUrl,
            mainText: introText,
            isPlus: isPremiumTier(member.tier),
            inOptOutTrial: member.isOptOutTrialing,
            inOptInTrial: member.isOptInTrialing,
            trialDaysLeft: member.daysLeftInTrial,
            previewText: introText,
            subjectLine: promptContent.subjectLine ?? "Cactus: Daily Prompt",
            isLastEmail: this.isLastEmail(member, latestResponse),
        }
        logger.info("Created Prompt Notification Template Data", data);
        return data;
    }

    buildPushData(params: { member: CactusMember, promptContent: PromptContent }): PushNotificationData {
        const { member, promptContent } = params;
        const introText = removeMarkdown(promptContent.getDynamicPreviewText({ member }) ?? "");

        const dataPayload: Record<string, string> = {};
        if (promptContent.entryId) {
            dataPayload.promptContentEntryId = promptContent.entryId;
        }
        if (promptContent.promptId) {
            dataPayload.promptId = promptContent.promptId;
        }

        const pushData: PushNotificationData = {
            body: introText,
            title: promptContent.subjectLine,
            badgeCount: 1,
            data: dataPayload
        }
        logger.info("Built push notification for prompt content", pushData);
        return pushData;

    }

    /**
     * Process a Push task to send a single member push notifications about a new prompt.
     * @param {SendPushNotificationParams} params
     * @return {Promise<NewPromptNotificationPushResult>}
     */
    async sendPromptNotificationPush(params: SendPushNotificationParams): Promise<NewPromptNotificationPushResult> {
        const { memberId, promptContentEntryId, memberSendDate } = params;
        logger.info("Send Push Notifications task called", stringifyJSON(params, 2));

        const { member } = await HoboCache.shared.getMemberById(memberId);
        const { promptContent } = await HoboCache.shared.fetchPromptContent(promptContentEntryId);

        if (!member || !promptContent) {
            logger.error("One or both of member, promptContent was not found. Can not send a push notification");
            return {
                attempted: false,
                error: "required data not present",
                retryable: false,
            }
        }

        const data: PushNotificationData = this.buildPushData({ member, promptContent });

        const notificationResult = await this.getOrCreatePushNotification({
            member,
            memberSendDate,
            data,
            promptContent
        })

        const errorMessage = (notificationResult as { errorMessage: string }).errorMessage;
        if (errorMessage) {
            return {
                attempted: false,
                error: errorMessage,
                retryable: true,
            }
        }
        const { notification, existing: notificationExisted } = (notificationResult as { notification: Notification, existing: boolean });

        const restrictedStatuses: SendStatus[] = [SendStatus.SENDING, SendStatus.SENT]
        const status = notification?.status;
        if (notificationExisted && status && restrictedStatuses.includes(status)) {
            logger.info("Notification is currently sending or has already sent", stringifyJSON(notification, 2));
            return {
                attempted: false,
                error: `push notification already exists and status is ${ notification.status }`
            };
        }

        const pushResult = await PushNotificationService.sharedInstance.sendPushDataToMember({ data, member })
        logger.info("Push result completed", pushResult);


        notification.status = SendStatus.SENT;
        await AdminNotificationService.getSharedInstance().save(notification);

        return {
            attempted: true,
            result: {
                numSuccess: pushResult.successCount,
                numError: pushResult.failureCount,
            },
            atLeastOneSuccess: pushResult.successCount > 0,
        };
    }
}