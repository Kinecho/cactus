import {Message} from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import MailchimpService from "@admin/services/MailchimpService";
import AdminSlackService, {ChatMessage, SlackAttachment} from "@admin/services/AdminSlackService";
import {
    BatchCreateResponse,
    OperationStatus,
    TagName,
    TagStatus,
    UpdateTagsRequest
} from "@shared/mailchimp/models/MailchimpTypes";
import {getConfig} from "@api/config/configService";
import {getDateFromISOString} from "@shared/util/DateUtil";

const config = getConfig();

const mailchimpBridgeSegmentId = config.mailchimp.bridge_to_monday_segment_id;

export async function onPublish(message: Message, context: functions.EventContext) {
    try {
        const members = await MailchimpService.getSharedInstance().getAllAudienceSegmentMembers(mailchimpBridgeSegmentId);

        const slackService = AdminSlackService.getSharedInstance();
        await slackService.sendDataLogMessage(`Starting Bridge To Monday Job for segmentId = ${mailchimpBridgeSegmentId}`);

        const attachments: SlackAttachment[] = [];

        attachments.push({
            title: `${members.length} Members to apply \`${TagName.ONBOARDING_SUPPRESSED}\``,
            text: `Not Actually Processing yet:\nMember List:\n${members.length === 0 ? "<none>" : members.map(member => member.email_address).join('\n')}`
        });

        const tagRequests: UpdateTagsRequest[] = members.map(member => {
            return {
                email: member.email_address as string,
                tags: [{name: TagName.ONBOARDING_SUPPRESSED, status: TagStatus.ACTIVE}]
            }
        });

        if (tagRequests.length === 0) {
            await slackService.sendDataLogMessage({
                text: "Bridge to Monday Prune Job finished. No members to update",
                attachments
            });
            return;
        }

        attachments.push({
            title: `Tag Requests (${tagRequests.length})`,
            text: `\`\`\`${JSON.stringify(tagRequests, null, 2)}\`\`\``
        });


        const batchResponse = await MailchimpService.getSharedInstance().bulkUpdateTags(tagRequests);

        const checkInterval = 10000;

        const batchResult = await new Promise<BatchCreateResponse | undefined>(async (resolve, reject) => {
            let status = batchResponse.status;
            let checkCount = 0;
            let completedBatch: BatchCreateResponse | undefined = undefined;
            const timeoutLimit = 60 * 5 * 1000;
            while (status !== OperationStatus.finished || (checkCount * checkInterval) > timeoutLimit) {
                await new Promise((innerResolve) => {
                    setTimeout(async () => {
                        console.log("Checking for batch status");
                        completedBatch = await MailchimpService.getSharedInstance().getBatchStatus(batchResponse);
                        console.log("Batch status check returned status", completedBatch.status);
                        checkCount++;
                        status = completedBatch.status;
                        innerResolve();
                    }, checkInterval)
                })

            }
            resolve(completedBatch);
            return;
        });

        attachments.push({
            title: `Batch Result Output`,
            text: `\`\`\`${batchResult ? JSON.stringify(batchResult, null, 2) : 'batch result was undefined'}\`\`\``
        });


        attachments.push({
            title: "Results Summary",
            fields: [
                {
                    title: "Finished operations",
                    value: `${batchResult ? batchResult.finished_operations : 0}`,
                    short: true,
                },
                {
                    title: "Errored operations",
                    value: `${batchResult ? batchResult.errored_operations : 0}`,
                    short: true,
                },
                {
                    title: "Total operations",
                    value: `${batchResult ? batchResult.total_operations : 0}`,
                    short: true,
                },
                {
                    title: "Batch Response Status",
                    value: `${batchResult ? batchResult.status : "Unknown"}`,
                    short: true,
                }
            ],
            ts: `${(getDateFromISOString(batchResult ? batchResult.completed_at : undefined) || new Date()).getTime() / 1000}`
        });

        const slackMessage: ChatMessage = {
            text: `*Bridge to Monday Prune Job*\nBatch Result \`${batchResult ? batchResult.status : "unknown"}\`\nFinished ${batchResult ? batchResult.finished_operations : 0}\nErrors ${batchResult ? batchResult.errored_operations : 0}`,
            attachments
        };


        await slackService.sendDataLogMessage(slackMessage);
    } catch (e) {
        console.error("Unable to execute BridgeToMondayJob", e);
        await AdminSlackService.getSharedInstance().sendDataLogMessage({
            text: "",
            color: "danger",
            attachments: [{text: `Error running Bridge to Monday Job\n\`\`\`${e.message}\`\`\``}]
        })
    }
}
