import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import CloudTaskService, { SubmitTaskResponse, TaskQueueConfigName } from "@admin/services/CloudTaskService";
import CactusMember, { PromptSendTime } from "@shared/models/CactusMember";
import {
    MemberPromptNotificationSetupInfo,
    MemberPromptNotificationTaskParams,
    MemberPromptNotificationTaskResult,
    NextPromptResult,
    SendEmailNotificationParams, SendEmailNotificationResult,
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
        const payload: SendEmailNotificationParams = {
            memberId: setupInfo.member?.id,
            promptContentEntryId: setupInfo.promptContent?.entryId
        };
        return await CloudTaskService.shared.submitHttpTask({
            queue: TaskQueueConfigName.send_emails,
            payload,
            processAt
        });
    }

    async createPushTask(setupInfo: MemberPromptNotificationSetupInfo, processAt?: Date): Promise<SubmitTaskResponse> {
        const payload: SendPushNotificationParams = {
            memberId: setupInfo.member?.id,
            promptContentEntryId: setupInfo.promptContent?.entryId
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
        logger.info(`Finished processing prompt notification for member ${ memberId }`, stringifyJSON(result, 2));
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
     * Send an email via SendGrid notifying a user about a new PromptContent available to them.,
     * @param {SendEmailNotificationParams} params
     * @return {Promise<SendEmailNotificationResult>}
     */
    async sendPromptNotificationEmail(params: SendEmailNotificationParams): Promise<SendEmailNotificationResult> {
        const { memberId, promptContentEntryId } = params;
        const { member } = await HoboCache.shared.getMemberById(memberId);
        const email = member?.email;
        const { promptContent } = await HoboCache.shared.fetchPromptContent(promptContentEntryId);
        if (!member || !promptContent || !promptContentEntryId || !memberId || !email || isBlank(email)) {
            return {
                sent: false,
                errorMessage: `unable to get both a member and prompt content from data: ${ stringifyJSON(params) }`
            };
        }
        const introText = removeMarkdown(promptContent.getDynamicPreviewText({ member })) as string;
        const promptUrl = buildPromptContentURL(promptContent, this.config);

        if (!promptUrl) {
            return {
                sent: false,
                errorMessage: `Unable to build a prompt url from promptContent: ${ stringifyJSON(promptContent) }`,
            }
        }

        const data: PromptNotificationEmail = {
            email,
            firstName: member.firstName,
            memberId,
            promptContentEntryId: promptContentEntryId,
            reflectUrl: promptUrl,
            mainText: introText,
            isPlus: isPremiumTier(member.tier),
            inOptOutTrial: member.isOptOutTrialing,
            inOptInTrial: member.isOptInTrialing,
            trialDaysLeft: member.daysLeftInTrial,
            previewText: introText
        }
        const sendResult = await AdminSendgridService.getSharedInstance().sendPromptNotification(data);

        return { sent: true, sendResult };
    }
}