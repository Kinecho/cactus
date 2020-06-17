import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import CloudTaskService, { SubmitTaskResponse, TaskQueueConfigName } from "@admin/services/CloudTaskService";
import CactusMember, { PromptSendTime } from "@shared/models/CactusMember";
import {
    MemberPromptNotificationTaskParams,
    MemberPromptNotificationTaskResult,
    NextPromptResult
} from "@admin/tasks/PromptNotificationTypes";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import Logger from "@shared/Logger"
import AdminSlackService, { ChannelName } from "@admin/services/AdminSlackService";
import { DateObject, DateTime } from "luxon";
import { getSendTimeUTC } from "@shared/util/DateUtil";
import { isSendTimeWindow } from "@shared/util/NotificationUtil";
import HoboCache from "@admin/HoboCache";

const logger = new Logger("PromptNotificationManager");


export default class PromptNotificationManager {
    static shared = new PromptNotificationManager();

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

    /**
     * For a given member ID, notify them of the daily new prompts, if needed.
     * This method needs to understand how to prevent sending more than once, as there is no guarantee
     * that it will only be called once for this per per day or new prompt.
     * @param {MemberPromptNotificationTaskParams} params
     * @return {Promise<MemberPromptNotificationTaskResult>}
     */
    async processMemberPromptNotification(params: MemberPromptNotificationTaskParams): Promise<MemberPromptNotificationTaskResult> {
        const { memberId, systemDateObject } = params;
        const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);

        if (!member) {
            return {
                memberId,
                success: false,
                retryable: false,
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

        if (!promptContent) {
            return {
                memberId,
                success: false,
                retryable: false,
                isSendTime,
                memberDateObject,
                usedCachedPromptContent,
                errorMessage: `No "next prompt content" could be found for member ${ memberId } for date ${ DateTime.fromObject(memberDateObject).toLocaleString() }`,
            }
        }

        logger.info(`Sending member ${ memberId } prompt entry ${ promptContent.entryId }: "${ promptContent.subjectLine }"`)
        const result = { memberId: memberId, success: true, promptContent };
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
        const { promptContent: pc, ...resultObject } = result;
        await AdminSlackService.getSharedInstance().uploadTextSnippet({
            message: `:squid: Prompt Notification Processed for MemberId \`${ memberId }\``,
            data: stringifyJSON({
                params, result: {
                    resultObject,
                    promptContent: {
                        entryId: pc?.entryId,
                        subjectLine: pc?.subjectLine
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
}