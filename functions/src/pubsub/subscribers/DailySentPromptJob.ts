import {Message} from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import AdminSlackService from "@admin/services/AdminSlackService";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import {getDateFromISOString, getISODate, isoDateStringToFlamelinkDateString} from "@shared/util/DateUtil";
import PromptContent from "@shared/models/PromptContent";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import * as prettyMilliseconds from "pretty-ms";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import CactusMember from "@shared/models/CactusMember";
import AdminSentPromptService, {UpsertSentPromptResult} from "@admin/services/AdminSentPromptService";


interface DailySentPromptMessage {
    contentDate?: string,
    sendDate?: string, //optional, will use promptDate if not set
}

export async function onPublish(message: Message, context: functions.EventContext) {
    let job: DailySentPromptMessage = {};

    if (message.json) {
        job = message.json as DailySentPromptMessage
    }

    let contentDate = getDateFromISOString(job.contentDate) || getTodaysDate();
    let sendDate: Date | undefined = getDateFromISOString(job.sendDate);
    await runJob(contentDate, sendDate);
}


export async function runJob(contentDate: Date, sendDate?: Date | undefined): Promise<JobResult> {
    try {
        let start = new Date();
        console.log("Starting DailySentPromptJob Processing job ");

        let content = await AdminPromptContentService.getSharedInstance().getPromptContentForDate(contentDate);
        console.log("got prompt content", content);

        if (!content) {
            await AdminSlackService.getSharedInstance()
                .sendEngineeringMessage(`:boom: \`DailySentPromptJob\` No prompt content was found for date ${isoDateStringToFlamelinkDateString(getISODate(todayDate))}`);
            return {error: "No PromptContent was found for given date"};
        }
        let promptId = content.promptId;
        if (!promptId) {
            await AdminSlackService.getSharedInstance()
                .sendEngineeringMessage(`:boom: \`DailySentPromptJob\` No promptId found on PromptContent \`\`\`${JSON.stringify(content.toJSON(), null, 2)}\`\`\``);
            return {error: "No promptId was found on the PromptContent", promptContentEntryId: content.entryId};
        }

        let prompt = await AdminReflectionPromptService.getSharedInstance().get(promptId);
        if (!prompt) {
            await AdminSlackService.getSharedInstance().sendEngineeringMessage(`:boom: \`DailySentPromptJob\` No prompt found for promptId \`${promptId}\``);
            return {
                error: "no ReflectionPrompt found for promptId " + promptId,
                promptContentEntryId: content.entryId,
                promptId,
            };
        }

        const result = await createSentPrompts(content, prompt, sendDate);

        let end = new Date();
        let duration = end.getTime() - start.getTime();

        await AdminSlackService.getSharedInstance().sendDataLogMessage({
            text: "",
            attachments: [{
                text: `\`DailySentPromptJob\` Completed in ${prettyMilliseconds(duration)}\n\`\`\`${JSON.stringify(result, null, 2)}\`\`\``,
                ts: end.getTime() / 1000
            }]
        });

        return result;

    } catch (error) {
        console.error("Failed to process Daily Sent Prompt Job", error);
        await AdminSlackService.getSharedInstance().sendEngineeringMessage(`:boom: Failed to process \`DailySentPromptJob\`\n\`\`\`${error}\`\`\``)
        return {
            error: `Failed to process: ${error.message} `,
            success: false,
            totalProcessed: 0,
            numSuccess: 0,
            numError: 0
        }
    }
}

function getTodaysDate(): Date {
    return new Date()
}

interface JobResult {
    promptContentEntryId?: string,
    promptId?: string,
    sendDate?: string,
    success: boolean,
    error?: string,
    totalProcessed: number,
    numSuccess: number,
    numError: number,
    numCreated: number,
    numUpdated: number,
}

export async function createSentPrompts(content: PromptContent, prompt: ReflectionPrompt, sendDate?: Date): Promise<JobResult> {

    const result: JobResult = {
        promptContentEntryIdId: content.entryId,
        promptId: prompt.id,
        sendDate: sendDate,
        success: true,
        totalProcessed: 0,
        numSuccess: 0,
        numError: 0,
        numCreated: 0,
        numUpdated: 0
    };

    try {
        await AdminCactusMemberService.getSharedInstance().getAllBatch({
            onData: async (members: CactusMember[]) => {
                console.log("Got members for batch");
                const sentPromptResults: UpsertSentPromptResult[] = await Promise.all(members.map(member => AdminSentPromptService.getSharedInstance().upsertForCactusMember(member, prompt, sendDate)));
                sentPromptResults.forEach(sp => {
                    if (!sp.error) {
                        result.numSuccess += 1;
                    } else {
                        result.numError += 1;
                    }

                    if (sp.sentPrompt && !sp.existed) {
                        result.numCreated += 1;
                    } else if (sp.existed) {
                        result.numUpdated += 1;
                    }
                });
                result.totalProcessed += members.length;
                console.log(`processed ${result.totalProcessed} so far`);
            }
        });
    } catch (error) {
        result.error = error;
        result.success = false;
    }

    return result;
}

