import {Message} from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import MailchimpService from "@shared/services/MailchimpService";
import AdminSlackService, {ChatMessage, SlackAttachment} from "@shared/services/AdminSlackService";
import {TagName, TagStatus, UpdateTagsRequest} from "@shared/mailchimp/models/MailchimpTypes";


const mailchimpBridgeSegmentId = 58045;

export async function onPublish(message: Message, context: functions.EventContext) {
    try {
        const members = await MailchimpService.getSharedInstance().getAllAudienceSegmentMembers(mailchimpBridgeSegmentId);

        const slackService = AdminSlackService.getSharedInstance();
        await slackService.sendDataLogMessage("Starting Bridge To Monday Job...");

        const attachments: SlackAttachment[] = [];

        attachments.push({
            title: "Members to apply \`onboarding_suppressed\`",
            text: `Not Actually Processing yet:\nMembers:\n${members.length === 0 ? "<none>" : members.map(member => member.email_address).join('\n')}`
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
            text: `Tag Requests (not sending yet)\n${JSON.stringify(tagRequests, null, 2)}`
        });



        //TODO: Don't send the batch request
        // const batchResponse = await MailchimpService.getSharedInstance().bulkUpdateTags(tagRequests);
        //
        // const checkInterval = 10000;
        //
        // const batchResult = await new Promise<BatchCreateResponse | undefined>(async (resolve, reject) => {
        //     let status = batchResponse.status;
        //     let checkCount = 0;
        //     let completedBatch: BatchCreateResponse | undefined = undefined;
        //     while (status !== OperationStatus.finished || checkCount * checkInterval > 60 * 5 * 1000) {
        //         setTimeout(async () => {
        //             completedBatch = await MailchimpService.getSharedInstance().getBatchStatus(batchResponse);
        //             checkCount++;
        //             status = completedBatch.status;
        //         }, checkInterval)
        //     }
        //     resolve(completedBatch);
        //     return;
        // });


        const slackMessage: ChatMessage = {
            // text: `Bridge to Monday Prune Job. Result \`${batchResult ? batchResult.status : "unknown"}\`\nFinished ${batchResult ? batchResult.finished_operations : 0}\nErrors ${batchResult ? batchResult.errored_operations : 0}`,
            text: `Bridge to Monday Prune Job. Result = not actually run.`,
            attachments
        };


        await slackService.sendDataLogMessage(slackMessage);
    } catch (e) {
        console.error("Unable to execute BridgeToMondayJob", e);
    }
}
