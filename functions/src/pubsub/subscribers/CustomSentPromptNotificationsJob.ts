import {Message} from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import CactusMember from "@shared/models/CactusMember";
import SentPrompt, {PromptSendMedium} from "@shared/models/SentPrompt";
import {DateObject, DateTime} from "luxon";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import PromptContent from "@shared/models/PromptContent";
import AdminSentPromptService, {CreateSentPromptResult} from "@admin/services/AdminSentPromptService";
import PushNotificationService from "@api/services/PushNotificationService";
import {isSendTimeWindow} from "@shared/util/NotificationUtil";
import {PromptNotificationResult} from "@admin/PushNotificationTypes";

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
    message?: string,
    pushResult?: PromptNotificationResult
    alreadyPushed?: boolean

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

    if (!userDateObject) {
        console.warn("Unable to get user's locale date");
        return result;
    }

    const isSendTime = isSendTimeWindow({currentDate: userDateObject, sendTime: userPromptSendTime});

    console.log("is send time", isSendTime);
    result.isSendTime = isSendTime;

    if (!isSendTime) {
        console.log("not the time to send notifications, returning");
        result.success = true;
        return result;
    }

    const promptContent = await AdminPromptContentService.getSharedInstance().getPromptContentForDate({dateObject: userDateObject});

    console.log("Fetched prompt content for member", promptContent?.subjectLine, promptContent?.scheduledSendAt);

    if (!promptContent) {
        result.success = false;
        errors.push(`No PromptContent Found For Date`);
        return result;
    }

    result.promptContent = promptContent;

    const memberId = member.id;
    const promptId = promptContent?.promptId;
    if (!memberId) {
        errors.push("No member ID could be found for the given inputs");
        return result;
    }

    if (!promptId) {
        errors.push("No promptID was found on the prompt content");
        return result;
    }

    const [existingSentPrompt] = await Promise.all([
        AdminSentPromptService.getSharedInstance().getSentPromptForCactusMemberId({cactusMemberId: memberId, promptId}),
    ]);

    if (existingSentPrompt) {
        console.log("The sent prompt existed... not doing anything");
        result.sentPromptExisted = true;
        result.sentPrompt = existingSentPrompt;
        result.alreadyPushed = existingSentPrompt.containsMedium(PromptSendMedium.PUSH);
        const pushResult = await PushNotificationService.sharedInstance.sendPushIfNeeded({
            sentPrompt: existingSentPrompt,
            promptContent,
            member
        });
        result.pushResult = pushResult;
        result.sentPush = pushResult?.atLeastOneSuccess || false;

        if (pushResult?.atLeastOneSuccess) {
            existingSentPrompt.sendHistory.push({
                medium: PromptSendMedium.PUSH,
                sendDate: new Date(),
                usedMemberCustomTime: true,
            });
        }
        result.sentPrompt = await AdminSentPromptService.getSharedInstance().save(existingSentPrompt);
        return result;
    } else {
        console.log("The sent prompt did not exist. Creating it now");
        result.sentPromptExisted = false;
        result.alreadyPushed = false;
        const createSentPromptResult: CreateSentPromptResult = AdminSentPromptService.createSentPrompt({
            member,
            promptContent,
            promptId,
            medium: PromptSendMedium.PUSH,
            createHistoryItem: false,
        });
        let sentPrompt = createSentPromptResult.sentPrompt;

        if (createSentPromptResult.error || !sentPrompt) {
            errors.push(createSentPromptResult.error || "unable to create sent prompt");
            result.createdSentPrompt = false;
            return result;
        }

        try {
            result.createdSentPrompt = true;
            const pushResult = await PushNotificationService.sharedInstance.sendPushIfNeeded({
                member,
                promptContent,
                sentPrompt,
            });
            result.pushResult = pushResult;
            result.sentPush = result.pushResult?.atLeastOneSuccess || false;
            if (pushResult?.atLeastOneSuccess) {
                sentPrompt.sendHistory.push({
                    medium: PromptSendMedium.PUSH,
                    sendDate: new Date(),
                    usedMemberCustomTime: true,
                });
            }
            sentPrompt = await AdminSentPromptService.getSharedInstance().save(sentPrompt);
            console.log("Saved sent prompt", sentPrompt.id);
            result.sentPrompt = sentPrompt;
        } catch (error) {
            const errorMessage = `Failed to save new sent prompt for member.id=${memberId} | promptId = ${promptId}`;
            console.error(errorMessage, error);
            errors.push(errorMessage);
            if (error.message) {
                errors.push(error.message);
            }
            return result;
        }
    }

    return result;
}
