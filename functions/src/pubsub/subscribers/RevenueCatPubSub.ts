import { Message } from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import { isWebhookPayload, WebhookPayload } from "@shared/api/RevenueCatApi";
import { PubSubService } from "@admin/pubsub/PubSubService";
import { PubSubTopic } from "@shared/types/PubSubTypes";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import Logger from "@shared/Logger"
import AdminSlackService, { ChannelName } from "@admin/services/AdminSlackService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";

const logger = new Logger("RevenueCatPubSub");

export async function onPublish(message: Message, context: functions.EventContext) {
    try {
        const payload = message.json;
        if (!payload) {
            logger.error("No message was passed into the queue. can not process. returning");
            return true;
        }

        if (!isWebhookPayload(payload)) {
            logger.error("Message event does not conform to RevenueCat webhook payload.", stringifyJSON(payload, 2));
            return true;
        }

        const event = payload.event;

        logger.info("retrieved the revenuecat event message", stringifyJSON(message.json, 2));

        const member = await AdminCactusMemberService.getSharedInstance().getById(event.app_user_id);
        await AdminSlackService.getSharedInstance().uploadTextSnippet({
            message: `:revenuecat: RevenueCat status update: \`${ event.type }\` for member ${ member?.email } \`${ event.app_user_id }\``,
            data: stringifyJSON(payload, 2),
            filename: `RevenueCatUpdate-${ event.id }.json`,
            fileType: "json",
            channel: ChannelName.subscription_status,
        })
        logger.info("Sent slack message about the status update");
        return true;
    } catch (error) {
        logger.error(error);
        return false;
    }
}

/**
 *
 * @param {WebhookPayload} payload
 * @return {Promise<string | undefined>} the Message ID if the message was successfully published
 */
export async function publishWebhookEvent(payload: WebhookPayload): Promise<string | undefined> {
    try {
        logger.info(`Submitting new job: ${ stringifyJSON(payload, 2) }`);
        const messageId = await PubSubService.getSharedInstance().pubsub.topic(PubSubTopic.revenuecat_events).publishJSON(payload);
        logger.info("Submitted message id", messageId);
        return messageId;
    } catch (error) {
        logger.error(`Failed to submit job ${ stringifyJSON(payload) }`, error);
        return;
    }
}