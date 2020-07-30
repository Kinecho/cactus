import { Message } from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import { PromptSendTime } from "@shared/models/CactusMember";
import SentPrompt from "@shared/models/SentPrompt";
import { DateObject } from "luxon";
import PromptContent from "@shared/models/PromptContent";
import { NewPromptNotificationPushResult } from "@admin/PushNotificationTypes";
import { convertDateToSendTimeUTC } from "@shared/util/DateUtil";
import AdminSlackService, { ChannelName } from "@admin/services/AdminSlackService";
import Logger from "@shared/Logger";
import AdminPromptNotificationManager from "@admin/managers/AdminPromptNotificationManager";
import { stringifyJSON } from "@shared/util/ObjectUtil";

const logger = new Logger("CustomSentPromptNotificationsJob");

export interface CustomNotificationJobResult {
    sendTimeUTC: PromptSendTime,
    success: boolean,
    numSuccess?: number,
    numAlreadyReflected?: number,
    numError?: number,
    numMembersFound?: number,
    numSentPromptsCreated?: number,
    numPushesSent?: number,
    systemDateObject?: DateObject,
    memberResults?: MemberResult[];
    error?: string,
    allErrors?: string[]
    emailsProcessed?: string[]
}

export interface CustomNotificationJob {
    dryRun: boolean,
    sendTimeUTC?: PromptSendTime;
    systemDateObject?: DateObject,
}

export interface MemberResult {
    success: boolean,
    isSendTime?: boolean,
    sentPush?: boolean,
    sentEmail?: boolean,
    alreadyReflected?: boolean,
    createdSentPrompt?: boolean,
    sentPromptExisted?: boolean,
    systemDate: DateObject,
    promptId?: string,
    sentPrompt?: SentPrompt
    promptContent?: PromptContent,
    memberId?: string,
    memberEmail?: string,
    memberDate?: DateObject,
    errors?: string[],
    message?: string,
    pushResult?: NewPromptNotificationPushResult
    alreadyPushed?: boolean
    memberSendTimeUTC?: PromptSendTime
    memberSendTimeLocal?: PromptSendTime
}

export async function onPublish(message: Message, context: functions.EventContext) {
    try {
        if (!message.json) {
            logger.error("No message json found");
            return;
        }
        const job: CustomNotificationJob = message.json;
        logger.log("processing job", job);
        const result = await runCustomNotificationJob(job);
        logger.log("Job result", result);
    } catch (error) {
        logger.error(error);
        return error;
    }
}

export async function runCustomNotificationJob(job: CustomNotificationJob): Promise<CustomNotificationJobResult> {
    const sendTimeUTC = job.sendTimeUTC || convertDateToSendTimeUTC(new Date());
    try {
        const jobStartTime = Date.now();
        const { tasks: taskResults, emails } = await AdminPromptNotificationManager.shared.createNotificationTasksForUTCSendTime(sendTimeUTC);

        const result: CustomNotificationJobResult = {
            sendTimeUTC,
            success: true,
            numSuccess: taskResults.length,
            systemDateObject: job.systemDateObject,
            numMembersFound: taskResults.length,
            emailsProcessed: emails,
        };

        logger.info("Finished processing custom sent time jobs", stringifyJSON(result, 2));
        const { memberResults, ...trimmedResult } = result;
        const endJobTime = (new Date()).getTime();
        await AdminSlackService.getSharedInstance().uploadTextSnippet({
            message: `:calling: Custom Sent Prompt Notification Job finished in ${ endJobTime - jobStartTime }ms.`,
            data: `${ JSON.stringify(trimmedResult, null, 2) }`,
            title: `Custom Send Time for h${ sendTimeUTC.hour } m${ sendTimeUTC.minute }`,
            filename: `custom-sent-prompt-${ sendTimeUTC.hour }-${ sendTimeUTC.minute }.json`,
            fileType: "json",
            channel: ChannelName.data_log,
        });
        return result;
    } catch (error) {
        logger.error(error);
        return { success: false, error: error.message, sendTimeUTC };
    }
}
