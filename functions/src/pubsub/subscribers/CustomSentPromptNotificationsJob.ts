import {Message} from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import CactusMember, {PromptSendTime} from "@shared/models/CactusMember";
import SentPrompt, {PromptSendMedium} from "@shared/models/SentPrompt";
import {DateObject, DateTime} from "luxon";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import PromptContent from "@shared/models/PromptContent";
import AdminSentPromptService, {CreateSentPromptResult} from "@admin/services/AdminSentPromptService";
import PushNotificationService from "@api/services/PushNotificationService";
import {isSendTimeWindow} from "@shared/util/NotificationUtil";
import {PromptNotificationResult} from "@admin/PushNotificationTypes";
import {convertDateToSendTimeUTC, getSendTimeUTC} from "@shared/util/DateUtil";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";

export interface CustomNotificationJobResult {
    success: boolean,
    memberResults?: MemberResult[];
    error?: string,
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
    pushResult?: PromptNotificationResult
    alreadyPushed?: boolean
    memberSendTimeUTC?: PromptSendTime
    memberSendTimeLocal?: PromptSendTime
}

export async function onPublish(message: Message, context: functions.EventContext) {
    if (!message.json) {
        console.error("No message json found");
        return;
    }
    const job: CustomNotificationJob = message.json;

    // const {dryRun} = job;
    // const contentDate = getDateFromISOString(job.contentDate) || getDateAtMidnightDenver();
    // const sendDate: Date | undefined = getDateFromISOString(job.sendDate);
    const result = await runCustomNotificationJob(job);
    console.log("Job result", result);
}

export async function runCustomNotificationJob(job: CustomNotificationJob): Promise<CustomNotificationJobResult> {
    const result: CustomNotificationJobResult = {success: false};

    const sendTimeUTC = job.sendTimeUTC || convertDateToSendTimeUTC(new Date());
    console.log("Looking for members where UTC send time is", JSON.stringify(sendTimeUTC));
    const members = await AdminCactusMemberService.getSharedInstance().getMembersForUTCSendPromptTime(sendTimeUTC);
    console.log("Got members", members.length);
    const memberResults: MemberResult[] = await Promise.all(members.map(member => processMember({job, member})));

    console.log("member results.length = ", memberResults.length);
    console.log(memberResults);
    result.memberResults = memberResults;
    console.log("Job result", result);
    return result;
}

function getMemberSendTimeInfo(options: { systemDateObject: DateObject, member: CactusMember }): { error?: string, isSendTime?: boolean, memberLocaleDateObject?: DateObject } {
    const {member, systemDateObject} = options;

    const memberSendTimeUTC = member.promptSendTimeUTC || getSendTimeUTC({
        forDate: new Date(),
        timeZone: member.timeZone,
        sendTime: member.promptSendTime
    });

    if (!memberSendTimeUTC) {
        console.log(`Member ${member.email} does not have a preferred send time in UTC. Not processing`);
        return {error: `memberSendTimeUTC not found on member ${member.email}`};
    }

    const systemJSDate = DateTime.fromObject(systemDateObject).setZone("utc").toJSDate();
    const memberLocaleDateObject = member.getCurrentLocaleDateObject(systemJSDate);
    const isSendTime = isSendTimeWindow({
        currentDate: systemDateObject,
        sendTime: memberSendTimeUTC,
    });

    return {isSendTime, memberLocaleDateObject}
}

export async function processMember(args: { job: CustomNotificationJob, member?: CactusMember }): Promise<MemberResult> {
    const {member, job} = args;
    const systemDateObject = job.systemDateObject || DateTime.utc().toObject();
    console.log("processMember job starting", JSON.stringify(job));

    if (!member) {
        console.error("No member provided to job. Exiting");
        return {success: false, errors: ["No member provided"], systemDate: systemDateObject};
    }

    const errors: string[] = [];
    const result: MemberResult = {
        success: false,
        createdSentPrompt: false,
        sentPush: false,
        sentEmail: false,
        systemDate: systemDateObject,
        errors,
        memberId: member?.id,
        memberEmail: member?.email
    };

    const {isSendTime, memberLocaleDateObject, error: sendTimeError} = getMemberSendTimeInfo({
        member,
        systemDateObject
    });

    if (sendTimeError) {
        console.error(sendTimeError);
        errors.push(sendTimeError);
        return result;
    }

    result.isSendTime = isSendTime;
    if (!isSendTime) {
        console.log(`not the time to send notification for ${member.email}, returning`);
        result.success = true;
        return result;
    }

    const promptContent = await AdminPromptContentService.getSharedInstance().getPromptContentForDate({dateObject: memberLocaleDateObject});
    console.log("Fetched prompt content for member", promptContent?.subjectLine, promptContent?.scheduledSendAt);

    if (!promptContent) {
        result.success = false;
        errors.push(`No PromptContent Found For member local date ${JSON.stringify(memberLocaleDateObject)}`);
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

    const {sentPrompt, existed: sentPromptExisted, error: sentPromptError} = await getOrCreateSentPrompt({
        memberId,
        member,
        promptContent,
        promptId
    });

    if (sentPromptError || !sentPrompt) {
        errors.push(sentPromptError || "No sent prompt was found or created, can not send push notifications.");
        return result;
    }

    const pushResult = await PushNotificationService.sharedInstance.sendPushIfNeeded({
        sentPrompt,
        promptContent,
        member
    });

    await handlePushResult({sentPrompt, pushResult, result, errors});

    result.sentPrompt = await AdminSentPromptService.getSharedInstance().save(sentPrompt);
    result.createdSentPrompt = !sentPromptExisted;

    return result;
}

async function getOrCreateSentPrompt(options: { promptContent: PromptContent, promptId: string, member: CactusMember, memberId: string, }): Promise<{ sentPrompt?: SentPrompt, existed: boolean, error?: string }> {
    const {promptContent, member, promptId, memberId} = options;

    const [existingSentPrompt] = await Promise.all([
        AdminSentPromptService.getSharedInstance().getSentPromptForCactusMemberId({cactusMemberId: memberId, promptId}),
    ]);

    let sentPrompt: SentPrompt;

    if (existingSentPrompt) {
        console.log("The sent prompt existed... not doing anything");
        return {sentPrompt: existingSentPrompt, existed: true}
    } else {
        console.log("The sent prompt did not exist. Creating it now");
        const createSentPromptResult: CreateSentPromptResult = AdminSentPromptService.createSentPrompt({
            member,
            promptContent,
            promptId,
        });

        if (createSentPromptResult.error || !createSentPromptResult.sentPrompt) {
            return {error: createSentPromptResult.error || "unable to create sent prompt", existed: false};
        }
        sentPrompt = createSentPromptResult.sentPrompt;
        return {sentPrompt, existed: false};
    }
}

/**
 * Handle the push notification result
 * @param {{sentPrompt: SentPrompt,
 *  pushResult?: PromptNotificationResult,
 *  result: MemberResult,
 *  errors: string[]}} options
 * @return {Promise<void>}
 */
async function handlePushResult(options: { sentPrompt: SentPrompt, pushResult?: PromptNotificationResult, result: MemberResult, errors: string[] }) {
    const {result, pushResult, sentPrompt, errors} = options;
    result.pushResult = pushResult;
    result.sentPush = result.pushResult?.atLeastOneSuccess || false;
    result.alreadyPushed = sentPrompt.containsMedium(PromptSendMedium.PUSH);
    if (pushResult?.atLeastOneSuccess) {
        sentPrompt.sendHistory.push({
            medium: PromptSendMedium.PUSH,
            sendDate: new Date(),
            usedMemberCustomTime: true,
        });
    } else if (!pushResult?.attempted) {
        result.success = true
    } else if ((pushResult?.result?.numError || 0) > 0) {
        errors.push("Failed to send any push notifications");
        result.success = false
    }
}