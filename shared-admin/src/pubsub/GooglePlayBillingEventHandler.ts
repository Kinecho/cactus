import Logger from "@shared/Logger";
import {DeveloperNotification} from "@shared/api/GooglePlayBillingTypes";
import AdminSlackService, {ChannelName} from "@admin/services/AdminSlackService";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import GooglePlayService from "@admin/services/GooglePlayService";

export default class GooglePlayBillingEventHandler {
    notification: DeveloperNotification;
    logger = new Logger("GooglePlayBillingEventHandler");

    constructor(payload: DeveloperNotification) {
        this.notification = payload;
    }

    async process(): Promise<void> {
        this.logger.info("Process job finished");

        const token = this.notification.subscriptionNotification?.purchaseToken;
        if (!token) {
            this.logger.error("No token was found on the notification object");
            return;
        }

        const purchase = await GooglePlayService.getSharedInstance().getPurchaseFromToken(token);
        if (!purchase) {
            this.logger.error("Failed to get a purchase from the google play api");
            return;
        }


        await AdminSlackService.getSharedInstance().uploadTextSnippet({
            message: "\`[GooglePlayBillingEventHandler]\` Got purchase and processed message.",
            data: stringifyJSON({notification: this.notification, purchase,}, 2),
            fileType: "json",
            filename: "google-play-billing-listeners-error.json",
            channel: ChannelName.subscription_status
        });

        return;
    }
}