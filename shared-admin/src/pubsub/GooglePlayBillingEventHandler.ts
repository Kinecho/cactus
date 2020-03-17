import Logger from "@shared/Logger";
import {DeveloperNotification} from "@shared/api/GooglePlayBillingTypes";
import AdminSlackService, {ChannelName} from "@admin/services/AdminSlackService";
import {stringifyJSON} from "@shared/util/ObjectUtil";

export default class GooglePlayBillingEventHandler {
    notification: DeveloperNotification;
    logger = new Logger("GooglePlayBillingEventHandler");

    constructor(payload: DeveloperNotification) {
        this.notification = payload;
    }

    async process(): Promise<void> {
        this.logger.info("Process job finished");

        await AdminSlackService.getSharedInstance().uploadTextSnippet({
            message: "[GooglePlayBillingEventHandler] Processed message.",
            data: stringifyJSON(this.notification, 2),
            fileType: "json",
            filename: "google-play-billing-listeners-error.json",
            channel: ChannelName.subscription_status
        });

        return;
    }
}