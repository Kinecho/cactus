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
import { getSendTimeUTC } from "@shared/util/DateUtil";
import { isSendTimeWindow } from "@shared/util/NotificationUtil";
import HoboCache from "@admin/HoboCache";
import AdminSendgridService from "@admin/services/AdminSendgridService";
import { PromptNotificationEmail } from "@admin/services/SendgridServiceTypes";
import { isBlank } from "@shared/util/StringUtil";
import { isPremiumTier } from "@shared/models/MemberSubscription";
import { buildPromptContentURL } from "@admin/util/StringUtil";
import { CactusConfig } from "@shared/CactusConfig";
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
import PushNotificationService from "../../../functions/src/services/PushNotificationService";

const removeMarkdown = require("remove-markdown");
const logger = new Logger("PromptNotificationManager");


export default class PromptNotificationManager {

    static shared: PromptNotificationManager;

    static initialize(config: CactusConfig) {
        PromptNotificationManager.shared = new PromptNotificationManager(config);
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
    async createNotificationTasksForUTCSendTime(sendTimeUTC: PromptSendTime): Promise<SubmitTaskResponse[]> {
        const memberResults: SubmitTaskResponse[] = []
        await AdminCactusMemberService.getSharedInstance().getMembersForUTCSendPromptTimeBatch(sendTimeUTC, {
            onData: async (members, batchNumber) => {
                const startTime = (new Date()).getTime();
                console.log(`Fetched ${ members.length } in batch ${ batchNumber }`);
                const memberBatchResult = await Promise.all(members.map(member => {
                    const memberId = member.id;
                    const payload: MemberPromptNotificationTaskParams = {
                        memberId: memberId,
                        promptSendTimeUTC: sendTimeUTC,
                        systemDateObject: DateTime.utc().toObject()
                    }
                    return this.createMemberNotificationTask(payload)
                }));
                memberResults.push(...memberBatchResult);
                const endTime = (new Date()).getTime();
                logger.log(`batch finished. Processed ${ memberBatchResult.length } members in batch ${ batchNumber } in ${ endTime - startTime }ms`);
            }
        });
        return memberResults;
    }

    /**
     * Create CloudTask httpTask for the given member. The task will then process the individual member's notification(s)
     * @param {MemberPromptNotificationTaskParams} payload - the payload to send to the task
     * @param {Date|undefined} processAt - Optional date in which this task should be processed. If omitted, it will process immediately.
     * @return {SubmitTaskResponse}
     */
    async createMemberNotificationTask(payload: MemberPromptNotificationTaskParams, processAt?: Date | undefined): Promise<SubmitTaskResponse> {
        return await CloudTaskService.shared.submitHttpTask({
            queue: TaskQueueConfigName.user_prompt_notifications,
            payload,
            processAt
        });
    }


    async createEmailTask(setupInfo: MemberPromptNotificationSetupInfo, processAt?: Date): Promise<SubmitTaskResponse> {
        const { member, promptContent, memberDateObject } = setupInfo;
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
            queue: TaskQueueConfigName.send_emails,
            payload,
            processAt
        });
    }

    async createPushTask(setupInfo: MemberPromptNotificationSetupInfo, processAt?: Date): Promise<SubmitTaskResponse> {
        const { member, promptContent, memberDateObject } = setupInfo;
        if ((member?.fcmTokens ?? []).length === 0) {
            return {
                success: true,
                skipped: true,
                message: "Member has no FCM tokens. Not sending push notifications",
            }
        }

        const payload: SendPushNotificationParams = {
            memberId: member?.id,
            promptContentEntryId: promptContent?.entryId,
            memberSendDate: memberDateObject,
        };

        return await CloudTaskService.shared.submitHttpTask({
            queue: TaskQueueConfigName.send_push_notifications,
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
    async processMemberPromptNotification(params: MemberPromptNotificationTaskParams): Promise<MemberPromptNotificationTaskResult> {
        const setupInfo = await this.getMemberPromptNotificationInfo(params);
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

        const [emailResult, pushResult] = await Promise.all([
            this.createEmailTask(setupInfo),
            this.createPushTask(setupInfo)
        ])

        result.emailTaskResponse = emailResult;
        result.pushTaskResponse = pushResult;

        return result;
    }

    async getMemberPromptNotificationInfo(params: MemberPromptNotificationTaskParams): Promise<MemberPromptNotificationSetupInfo> {
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

        if (!isSendTime) {
            logger.warn("It's not currently the member's send time, but will send anyway")
        }

        let errorMessage: string | undefined;
        if (!promptContent) {
            errorMessage = `No "next prompt content" could be found for member ${ member.id } for date ${ memberDateObject ? DateTime.fromObject(memberDateObject).toLocaleString() : "undefined" }`;
        }
        logger.info(`Sending member ${ memberId } prompt entry ${ promptContent?.entryId ?? "[none]" }: "${ promptContent?.subjectLine ?? "[none]" }"`)
        const result = {
            member,
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
     * @return {Promise<void>}
     */
    async notifySlackResults(params: MemberPromptNotificationTaskParams, result: MemberPromptNotificationTaskResult) {
        const { memberId } = params;
        const { promptContent: pc, member, ...setupObject } = result.setupInfo ?? {};

        await AdminSlackService.getSharedInstance().uploadTextSnippet({
            message: `:squid: :woman-golfing: Prompt Notification Processed for MemberId \`${ memberId }\``,
            data: stringifyJSON({
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

        const emailData = this.buildEmailNotificationTemplateData({ member, promptContent });
        if (!emailData) {
            return { sent: false, errorMessage: "Unable to build email data for the notification." };
        }

        const { notification, existing: notificationExisted } = await this.getOrCreateEmailNotification({
            member,
            promptContent,
            emailData,
            memberSendDate
        });

        if (notificationExisted && [SendStatus.SENDING, SendStatus.SENT].includes(notification?.status)) {
            logger.info("Notification is currently sending or has already sent", stringifyJSON(notification, 2));
            return { sent: false, message: `email notification already exists and status is ${ notification.status }` };
        }

        const sendResult = await AdminSendgridService.getSharedInstance().sendPromptNotification(emailData);

        notification.status = SendStatus.SENT;
        await AdminNotificationService.getSharedInstance().save(notification);

        return { sent: true, sendResult };
    }

    async getOrCreatePushNotification(params: {
        member: CactusMember,
        promptContent: PromptContent,
        data: PushNotificationData,
        memberSendDate?: DateObject,
    }): Promise<{ notification: Notification, existing: boolean }> {
        const { member, promptContent, data, memberSendDate } = params;
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
            }, { transaction })

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
                notification = await AdminNotificationService.getSharedInstance().save(notification, { transaction });
            } else {
                existing = true;
                logger.info("Found existing PUSH notification:", stringifyJSON(notification, 2));

            }
            return { notification, existing };
        });
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
    }): Promise<{ notification: Notification, existing: boolean }> {
        const { member, promptContent, emailData, memberSendDate } = params;
        return await AdminFirestoreService.getSharedInstance().firestore.runTransaction<{ notification: Notification, existing: boolean }>(async transaction => {
            const uniqueBy = memberSendDate ? Notification.uniqueByDateObject(memberSendDate) : undefined;
            let existing = false;
            let notification: Notification | undefined = await AdminNotificationService.getSharedInstance().findFirst({
                uniqueBy,
                type: NotificationType.NEW_PROMPT,
                contentType: NotificationContentType.promptContent,
                contentId: promptContent.entryId,
                channel: NotificationChannel.EMAIL,
                memberId: member.id!,
            }, { transaction })

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
            return { notification, existing };
        });
    }

    buildEmailNotificationTemplateData(params: { member: CactusMember, promptContent: PromptContent }): PromptNotificationEmail | null {
        const { member, promptContent } = params;
        const introText = removeMarkdown(promptContent.getDynamicPreviewText({ member })) as string;
        const promptUrl = buildPromptContentURL(promptContent, this.config);

        if (!promptUrl || !member.id || !member.email) {
            logger.error("Unable to build prompt data");
            return null
        }

        const data: PromptNotificationEmail = {
            email: member.email,
            firstName: member.firstName,
            memberId: member.id,
            promptContentEntryId: promptContent.entryId!,
            reflectUrl: promptUrl,
            mainText: introText,
            isPlus: isPremiumTier(member.tier),
            inOptOutTrial: member.isOptOutTrialing,
            inOptInTrial: member.isOptInTrialing,
            trialDaysLeft: member.daysLeftInTrial,
            previewText: introText,
            subjectLine: promptContent.subjectLine ?? "Cactus: Daily Prompt"
        }
        logger.info("Created Prompt Notification Template Data", data);
        return data;
    }

    buildPushData(params: { member: CactusMember, promptContent: PromptContent }): PushNotificationData {
        const { member, promptContent } = params;
        const introText = removeMarkdown(promptContent.getDynamicPreviewText({ member }));

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
            }
        }

        const data: PushNotificationData = this.buildPushData({ member, promptContent });

        const { notification, existing: notificationExisted } = await this.getOrCreatePushNotification({
            member,
            memberSendDate,
            data,
            promptContent
        })

        if (notificationExisted && [SendStatus.SENDING, SendStatus.SENT].includes(notification?.status)) {
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