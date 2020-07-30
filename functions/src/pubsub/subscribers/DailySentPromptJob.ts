import { Message } from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import AdminSlackService from "@admin/services/AdminSlackService";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import {
    getDateAtMidnightDenver,
    getDateFromISOString, getFlamelinkDateString,
    getISODate,
    isoDateStringToFlamelinkDateString
} from "@shared/util/DateUtil";
import PromptContent from "@shared/models/PromptContent";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import * as prettyMilliseconds from "pretty-ms";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import CactusMember from "@shared/models/CactusMember";
import AdminSentPromptService, { UpsertSentPromptResult } from "@admin/services/AdminSentPromptService";
import Logger from "@shared/Logger";

const logger = new Logger("DailySentPromptJob");

interface DailySentPromptMessage {
    contentDate?: string,
    sendDate?: string, //optional, will use promptDate if not set
    dryRun?: boolean,
}


interface JobResult {
    dryRun?: boolean,
    promptContentEntryId?: string,
    subjectLine?: string,
    promptQuestion?: string,
    promptId?: string,
    contentDate?: string,
    sendDate?: string,
    success: boolean,
    error?: string,
    totalProcessed?: number,
    numSuccess?: number,
    numError?: number,
    numCreated?: number,
    numUpdated?: number,
    numBatches?: number,
    durationMs?: number,
}

export async function onPublish(message: Message, context: functions.EventContext) {
    try {
        let job: DailySentPromptMessage = { dryRun: false };

        if (message.json) {
            job = message.json as DailySentPromptMessage
        }

        const { dryRun } = job;
        const contentDate = getDateFromISOString(job.contentDate) || getDateAtMidnightDenver();
        const sendDate: Date | undefined = getDateFromISOString(job.sendDate);
        await runJob(contentDate, sendDate, dryRun);
        return;
    } catch (error) {
        logger.error(error);
        return null;
    }
}

export async function runJob(contentDate: Date, sendDate?: Date | undefined, dryRun: boolean = false): Promise<JobResult> {
    try {
        const start = new Date();
        logger.log("Starting DailySentPromptJob Processing job ");

        const content = await AdminPromptContentService.getSharedInstance().getPromptContentForDate({ systemDate: contentDate });
        logger.log("got prompt content", content);

        if (!content) {
            await AdminSlackService.getSharedInstance()
            .sendEngineeringMessage(`:boom: \`DailySentPromptJob\` No prompt content was found for date ${ isoDateStringToFlamelinkDateString(getISODate(contentDate)) }${ dryRun ? "\nThis was a DRY RUN" : "" }`);
            return { error: "No PromptContent was found for given date", success: false, dryRun };
        }
        const promptId = content.promptId;
        if (!promptId) {
            await AdminSlackService.getSharedInstance()
            .sendEngineeringMessage(`:boom: \`DailySentPromptJob\` No promptId found on PromptContent \`\`\`${ JSON.stringify(content.toJSON(), null, 2) }\`\`\`${ dryRun ? "\nThis was a DRY RUN" : "" }`);
            return {
                error: "No promptId was found on the PromptContent",
                promptContentEntryId: content.entryId,
                success: false,
                dryRun,
            };
        }

        const prompt = await AdminReflectionPromptService.getSharedInstance().get(promptId);
        if (!prompt) {
            await AdminSlackService.getSharedInstance().sendEngineeringMessage(`:boom: \`DailySentPromptJob\` No prompt found for promptId \`${ promptId }\`${ dryRun ? "\nThis was a DRY RUN" : "" }`);
            return {
                success: false,
                error: "no ReflectionPrompt found for promptId " + promptId,
                promptContentEntryId: content.entryId,
                promptId,
                dryRun,
            };
        }

        const result = await createSentPrompts(content, prompt, sendDate, dryRun);
        logger.log("Create Sent Prompts Result", JSON.stringify(result, null, 2));
        const end = new Date();
        const duration = end.getTime() - start.getTime();

        await AdminSlackService.getSharedInstance().sendDataLogMessage({
            text: "",
            attachments: [{
                text: `\`DailySentPromptJob\` Completed in ${ prettyMilliseconds(duration) }\n\`\`\`${ JSON.stringify(result, null, 2) }\`\`\``,
                ts: `${ end.getTime() / 1000 }`
            }]
        });

        return result;

    } catch (error) {
        logger.error("Failed to process Daily Sent Prompt Job", error);
        await AdminSlackService.getSharedInstance().sendEngineeringMessage(`:boom: Failed to process \`DailySentPromptJob\`\n\`\`\`${ error }\`\`\``);
        return {
            sendDate: getISODate(sendDate),
            error: `Failed to process: ${ error.message } `,
            success: false,
            totalProcessed: 0,
            numSuccess: 0,
            numError: 0,
            dryRun,
        }
    }
}


export async function createSentPrompts(content: PromptContent, prompt: ReflectionPrompt, sendDate?: Date, dryRun: boolean = false): Promise<JobResult> {
    const start = new Date();
    const result: JobResult = {
        dryRun,
        subjectLine: content.subjectLine,
        promptQuestion: prompt.question,
        promptContentEntryId: content.entryId,
        promptId: prompt.id,
        contentDate: content.scheduledSendAt ? getFlamelinkDateString(content.scheduledSendAt) : undefined,
        sendDate: getISODate(sendDate),
        success: true,
        totalProcessed: 0,
        numSuccess: 0,
        numError: 0,
        numCreated: 0,
        numUpdated: 0,
        numBatches: 0,
    };

    try {
        await AdminCactusMemberService.getSharedInstance().getAllBatch({
            onData: async (members: CactusMember[]) => {
                logger.log(`Got members for batch${ dryRun ? "\nThis was a DRY RUN" : "" }`);
                result.numBatches! += 1;
                const sentPromptResults: UpsertSentPromptResult[] = await Promise.all(members.map(member => AdminSentPromptService.getSharedInstance().upsertForCactusMember(member, prompt, sendDate, dryRun)));
                sentPromptResults.forEach(sp => {
                    if (!sp.error) {
                        result.numSuccess! += 1;
                    } else {
                        result.numError! += 1;
                    }

                    if (sp.sentPrompt && !sp.existed) {
                        result.numCreated! += 1;
                    } else if (sp.existed) {
                        result.numUpdated! += 1;
                    }
                });
                result.totalProcessed! += members.length;
                logger.log(`processed ${ result.totalProcessed } so far ${ dryRun ? "\nThis was a DRY RUN" : "" }`);
            }
        });
        const end = new Date();
        result.durationMs = end.getTime() - start.getTime();
    } catch (error) {
        logger.error(error);
        result.error = error;
        result.success = false;
    }

    return result;
}

