import {Message} from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import AdminSubscriptionService from "@admin/services/AdminSubscriptionService";
import AdminSlackService, {ChannelName} from "@admin/services/AdminSlackService";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import Logger from "@shared/Logger";
import {PubSubTopic} from "@shared/types/PubSubTypes";
import {PubSubService} from "@admin/pubsub/PubSubService";

const logger = new Logger("SyncTrialMembersToMailchimpJob");

export interface SyncTrialMembersToMailchimpJob {
    lastMemberId?: string;
    lastCreatedAtMs?: number,
    batchSize?: number;
    batchNumber?: number;
}

export async function submitJob(job: SyncTrialMembersToMailchimpJob): Promise<string | undefined> {
    try {
        logger.info(`Submitting new job: ${stringifyJSON(job, 2)}`);
        // const pubsub = new PubSub();
        // logger.info("pubsub object", pubsub);
        const messageId = await PubSubService.getSharedInstance().pubsub.topic(PubSubTopic.sync_trial_members_to_mailchimp).publishJSON(job);
        logger.info("Submitted message id", messageId);
        return messageId;
    } catch (error) {
        logger.error(`Failed to submit job ${stringifyJSON(job)}`, error);
        return;
    }
}

export async function onPublish(message: Message, context: functions.EventContext) {
    logger.info("Starting SyncTrial job for message", message);
    const job = message.json as SyncTrialMembersToMailchimpJob | undefined;
    if (!job) {
        logger.error("No job message was provided. Not executing");
        return;
    }

    const result = await AdminSubscriptionService.getSharedInstance().syncTrialingMemberWithMailchimpBatch(job);

    let nextJob: SyncTrialMembersToMailchimpJob | undefined;
    let nextJobId: string | undefined;

    if (result.lastMemberId) {
        nextJob = {
            lastMemberId: result.lastMemberId,
            lastCreatedAtMs: result.lastCreatedAt?.getTime(),
            batchNumber: (job.batchNumber || 0) + 1,
            batchSize: job.batchSize
        };

        nextJobId = await submitJob(nextJob);
        logger.info("Submitted job with ID ", nextJobId);
    }

    const slackContent = {
        batchSize,
        result,
        nextJob,
        nextJobMessageId: nextJobId
    };
    await AdminSlackService.getSharedInstance().uploadTextSnippet({
        message: ":monkey: `Sync Trial Members to Mailchimp` batch " + job.batchNumber + " finished",
        data: stringifyJSON(slackContent, 2),
        channel: ChannelName.data_log,
        filename: `SyncTrialMembersToMailchimpJob-Batch${job.batchNumber}-${new Date().toISOString()}.json`,
        fileType: "json",
    })
}