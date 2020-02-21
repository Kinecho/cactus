import {Message} from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import AdminSubscriptionService from "@admin/services/AdminSubscriptionService";
import AdminSlackService from "@admin/services/AdminSlackService";
import {stringifyJSON} from "@shared/util/ObjectUtil";

export async function onPublish(message: Message, context: functions.EventContext) {
    const result = await AdminSubscriptionService.getSharedInstance().syncTrialingMemberWithMailchimp();
    await AdminSlackService.getSharedInstance().sendDataLogMessage(":monkey: `Sync Trial Members to Mailchimp`\n\`\`\`" + stringifyJSON(result) + "\`\`\`")
}