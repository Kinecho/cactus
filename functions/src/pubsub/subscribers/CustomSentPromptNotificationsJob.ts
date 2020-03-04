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
import {NewPromptNotificationResult} from "@admin/PushNotificationTypes";
import {convertDateToSendTimeUTC, getSendTimeUTC} from "@shared/util/DateUtil";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminSlackService, {ChannelName} from "@admin/services/AdminSlackService";
import Logger from "@shared/Logger";

const logger = new Logger("CustomSentPromptNotificationsJob");
const contentCacheByDate: { [date: string]: PromptContent | undefined } = {};

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
    pushResult?: NewPromptNotificationResult
    alreadyPushed?: boolean
    memberSendTimeUTC?: PromptSendTime
    memberSendTimeLocal?: PromptSendTime
}

export async function onPublish(message: Message, context: functions.EventContext) {
    if (!message.json) {
        logger.error("No message json found");
        return;
    }
    const job: CustomNotificationJob = message.json;
    logger.log("processing job", job);
    // const {dryRun} = job;
    // const contentDate = getDateFromISOString(job.contentDate) || getDateAtMidnightDenver();
    // const sendDate: Date | undefined = getDateFromISOString(job.sendDate);
    const result = await runCustomNotificationJob(job);
    logger.log("Job result", result);
}

export async function runCustomNotificationJob(job: CustomNotificationJob): Promise<CustomNotificationJobResult> {
    const jobStartTime = (new Date()).getTime();
    const sendTimeUTC = job.sendTimeUTC || convertDateToSendTimeUTC(new Date());
    const result: CustomNotificationJobResult = {
        sendTimeUTC,
        success: false,
        systemDateObject: job.systemDateObject,
        numMembersFound: 0
    };

    logger.log("Looking for members where UTC send time is", JSON.stringify(sendTimeUTC));

    const allErrors: string[] = [];

    const emailsProcessed: string[] = [];
    const memberResults: MemberResult[] = [];

    await AdminCactusMemberService.getSharedInstance().getMembersForUTCSendPromptTimeBatch(sendTimeUTC, {
        onData: async (members, batchNumber) => {
            const startTime = (new Date()).getTime();
            console.log(`Fetched ${members.length} in batch ${batchNumber}`);
            result.numMembersFound = (result.numMembersFound || 0) + members.length;

            const memberBatchResult = await Promise.all(members.map(member => processMember({
                job,
                member
            })));
            memberResults.push(...memberBatchResult);
            const endTime = (new Date()).getTime();
            logger.log(`batch finished. Processed ${memberBatchResult.length} members in batch ${batchNumber} in ${endTime - startTime}ms`);
        }
    });
    logger.info("Finished processing all members... setting up results object");
    memberResults.forEach(r => {
        if (r.sentPush) {
            result.numPushesSent = (result.numPushesSent || 0) + 1;
        }
        if (r.errors) {
            allErrors.push(...r.errors);
        }

        if (r.createdSentPrompt) {
            result.numSentPromptsCreated = (result.numSentPromptsCreated || 0) + 1;
        }

        if (r.success) {
            result.numSuccess = (result.numSuccess || 0) + 1;
        } else {
            result.numError = (result.numError || 0) + 1;
        }

        if (r.memberEmail) {
            emailsProcessed.push(r.memberEmail);
        }

        if (r.alreadyReflected) {
            result.numAlreadyReflected = (result.numAlreadyReflected || 0) + 1;
        }
    });

    result.success = true;
    result.allErrors = allErrors;
    result.emailsProcessed = emailsProcessed;

    logger.log("member results.length = ", memberResults.length);
    logger.log(memberResults);
    result.memberResults = memberResults;
    logger.log("Job result", result);
    const trimmedResult = {...result};
    delete trimmedResult.memberResults;
    const endJobTime = (new Date()).getTime();
    await AdminSlackService.getSharedInstance().uploadTextSnippet({
        message: `:calling: Custom Sent Prompt Notification Job finished in ${endJobTime - jobStartTime}ms.`,
        data: `${JSON.stringify(trimmedResult, null, 2)}`,
        title: `Custom Send Time for h${sendTimeUTC.hour} m${sendTimeUTC.minute}`,
        filename: `custom-sent-prompt-${sendTimeUTC.hour}-${sendTimeUTC.minute}.json`,
        fileType: "json",
        channel: ChannelName.data_log,
    });
    return result;
}

async function getPromptContentFromCache(dateObject: DateObject): Promise<PromptContent | undefined> {
    const dateISO = DateTime.fromObject(dateObject).toISO();
    if (contentCacheByDate.hasOwnProperty(dateISO)) {
        return contentCacheByDate[dateISO];
    }
    logger.info(`No prompt content found in cache for date ${dateISO}, fetching from server`);
    const promptContent = await AdminPromptContentService.getSharedInstance().getPromptContentForDate({
        dateObject: dateObject,
    });
    logger.info(`setting cache key ${dateISO} to promptContent.promptId ${promptContent?.promptId}`);
    contentCacheByDate[dateISO] = promptContent;

    return promptContent;
}

function getMemberSendTimeInfo(options: { systemDateObject: DateObject, member: CactusMember }): { error?: string, isSendTime?: boolean, memberLocaleDateObject?: DateObject } {
    const {member, systemDateObject} = options;

    const memberSendTimeUTC = member.promptSendTimeUTC || getSendTimeUTC({
        forDate: new Date(),
        timeZone: member.timeZone,
        sendTime: member.promptSendTime
    });

    if (!memberSendTimeUTC) {
        logger.log(`Member ${member.email} does not have a preferred send time in UTC. Not processing`);
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
    logger.log("processMember job starting", JSON.stringify(job));

    if (!member) {
        logger.error("No member provided to job. Exiting");
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

    if (!memberLocaleDateObject?.day) {
        const msg = `No member local date object was able to be determined for member ${member.email} (${member.id})`
        logger.error(msg, systemDateObject);
        errors.push(msg);
        return result;
    }

    if (sendTimeError) {
        logger.error(sendTimeError);
        errors.push(sendTimeError);
        return result;
    }

    result.isSendTime = isSendTime;
    if (!isSendTime) {
        logger.log(`not the time to send notification for ${member.email}, returning`);
        result.success = true;
        return result;
    }

    const promptContent = await getPromptContentFromCache(memberLocaleDateObject);
    logger.log("Fetched prompt content for member", promptContent?.subjectLine, promptContent?.scheduledSendAt);

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

    const memberTier = member.subscription?.tier;
    const contentTiers = promptContent?.subscriptionTiers;

    if (memberTier && contentTiers && 
        !contentTiers.includes(memberTier)) {
        errors.push("Member SubscriptionTier was not included in PromptContent tiers");
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

    const pushResult = await PushNotificationService.sharedInstance.sendNewPromptPushIfNeeded({
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
        logger.log("The sent prompt existed... not doing anything");
        return {sentPrompt: existingSentPrompt, existed: true}
    } else {
        logger.log("The sent prompt did not exist. Creating it now");
        const createSentPromptResult: CreateSentPromptResult = AdminSentPromptService.createSentPrompt({
            member,
            promptContent,
            promptId,
            createHistoryItem: true,
            medium: PromptSendMedium.CUSTOM_SENT_PROMPT_TIME,
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
 *  pushResult?: NewPromptNotificationResult,
 *  result: MemberResult,
 *  errors: string[]}} options
 * @return {Promise<void>}
 */
async function handlePushResult(options: { sentPrompt: SentPrompt, pushResult?: NewPromptNotificationResult, result: MemberResult, errors: string[] }) {
    const {result, pushResult, sentPrompt, errors} = options;
    result.pushResult = pushResult;
    result.sentPush = result.pushResult?.atLeastOneSuccess || false;
    result.alreadyPushed = sentPrompt.containsMedium(PromptSendMedium.PUSH);
    result.alreadyReflected = pushResult?.alreadyAnswered ?? false;
    if (pushResult?.atLeastOneSuccess) {
        result.success = true;
        sentPrompt.sendHistory.push({
            medium: PromptSendMedium.PUSH,
            sendDate: new Date(),
            usedMemberCustomTime: true,
        });
    } else if (!pushResult?.attempted) {
        result.success = true;
    } else if ((pushResult?.result?.numError || 0) > 0) {
        errors.push(`Failed to send any push notifications to ${sentPrompt.memberEmail}`);
        result.success = false
    }
}