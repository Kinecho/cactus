import { Message } from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import GooglePlayBillingEventHandler from "@admin/pubsub/GooglePlayBillingEventHandler";
import Logger from "@shared/Logger";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import { isDeveloperNotification } from "@shared/api/GooglePlayBillingTypes";
import AdminSlackService, { ChannelName } from "@admin/services/AdminSlackService";

const logger = new Logger("GooglePlayBillingListeners");

export async function onPublish(message: Message, context: functions.EventContext) {
    try {
        const payload = message.json;
        if (!isDeveloperNotification(payload)) {
            await AdminSlackService.getSharedInstance().uploadTextSnippet({
                message: "Unable to process message. The payload did not conform to type \`DeveloperNotification\`",
                data: stringifyJSON(payload, 2),
                fileType: "json",
                filename: "google-play-billing-listeners-error.json",
                channel: ChannelName.subscription_status
            });
            logger.error("The message payload was not a developer notification. Payload is: ", stringifyJSON(payload, 2));
            return;
        }
        logger.info("Processing payload: ", stringifyJSON(payload));
        const job = new GooglePlayBillingEventHandler(payload);
        await job.process();

        return "Google Cloud billing";
    } catch (error) {
        logger.error(error);
        return null;
    }
}
