import {Message} from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import CactusMember from "@shared/models/CactusMember";
import SentPrompt from "@shared/models/SentPrompt";
import {DateObject, DateTime} from "luxon";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import PromptContent from "@shared/models/PromptContent";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import PushNotificationService, {PromptNotificationResult} from "@api/services/PushNotificationService";
import {isSendTimeWindow} from "@shared/util/NotificationUtil";

export interface CustomNotificationJobResult {
    success: boolean,
}

interface JobMessage {
    dryRun: boolean,
}

export interface CustomNotificationJob {
    dryRun: boolean,
}

export interface MemberResult {
    success: boolean,
    createdSentPrompt: boolean,
    sentPromptExisted?: boolean,
    systemDate: DateObject,
    isSendTime?: boolean,
    promptId?: string,
    sentPrompt?: SentPrompt
    promptContent?: PromptContent,
    sentPush: boolean,
    sentEmail: boolean,

    memberId?: string,
    memberEmail?: string,
    memberDate?: DateObject,
    errors?: string[],
    pushResult?: PromptNotificationResult

}

export async function onPublish(message: Message, context: functions.EventContext) {
    let job: CustomNotificationJob = {dryRun: false};

    if (message.json) {
        const jobMessage = message.json as JobMessage;
        job = {dryRun: jobMessage.dryRun};
    }

    // const {dryRun} = job;
    // const contentDate = getDateFromISOString(job.contentDate) || getDateAtMidnightDenver();
    // const sendDate: Date | undefined = getDateFromISOString(job.sendDate);
    const result = await runJob(job);
    console.log("Job result", result);

}


export async function runJob(job: CustomNotificationJob): Promise<CustomNotificationJobResult> {
    const result: CustomNotificationJobResult = {success: false};

    console.log("Job result", result);
    return result;
}

export async function processMember(args: { job: CustomNotificationJob, member?: CactusMember }): Promise<MemberResult> {
    const {member, job} = args;
    const systemDate = DateTime.local().toObject();
    const errors: string[] = [];
    const result: MemberResult = {
        success: false,
        createdSentPrompt: false,
        sentPush: false,
        sentEmail: false,
        systemDate,
        errors,
    };
    console.log("processing member for job", job);
    console.log("processing member", member?.id || "not set");

    if (!member) {
        return result;
    }

    const userTZ = member.timeZone;
    const userPromptSendTime = member.promptSendTime;

    if (!userTZ || !userPromptSendTime) {
        console.log(`Member ${member.email} does not have a preferred send time. Not processing`);
        return result;

    }
    console.log("timezone =", userTZ);
    console.log("preferredSendTime", userPromptSendTime);

    const userDateObject = member.getCurrentLocaleDateObject();
    result.memberDate = userDateObject;
    console.log("user date obj", userDateObject);
    console.log("user date (locale)", userDateObject?.toLocaleString());

    if (!userDateObject) {
        console.warn("Unable to get user's locale date");
        return result;
    }

    const isSendTime = isSendTimeWindow({currentDate: userDateObject, sendTime: userPromptSendTime});

    console.log("is send time", isSendTime);
    result.isSendTime = isSendTime;

    if (!isSendTime) {
        console.log("not the time to send notifications, returning");
        return result;
    }

    const promptContent = await AdminPromptContentService.getSharedInstance().getPromptContentForDate({dateObject: userDateObject});

    console.log("Fetched prompt content for member", promptContent?.subjectLine, promptContent?.scheduledSendAt);

    result.promptContent = promptContent;

    const memberId = member.id;
    const promptId = promptContent?.promptId;
    if (!memberId || !promptId) {

        return result;
    }


    const [existingSentPrompt] = await Promise.all([
        AdminSentPromptService.getSharedInstance().getSentPromptForCactusMemberId({cactusMemberId: memberId, promptId}),
    ]);

    if (promptContent) {
        try {
            const pushResult = await PushNotificationService.sharedInstance.sendPromptNotification({
                member,
                promptContent
            });
            console.log("Push result", pushResult);
            result.sentPush = true;
            result.pushResult = pushResult;
        } catch (error) {
            console.error("Failed to send push message", error);
            result.sentPush = false;
            errors.push("Failed to sent push notification");
        }
    }


    if (existingSentPrompt) {
        result.sentPromptExisted = true;
        result.sentPrompt = existingSentPrompt;
        //TODO: do we need to do the push?
        return result;
    } else {
        result.sentPromptExisted = false;
    }


    return result;
}