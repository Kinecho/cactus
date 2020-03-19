import Logger from "@shared/Logger";
import {
    DeveloperNotification,
    getCancelReasonDescription,
    getSubscriptionNotificationDescription
} from "@shared/api/GooglePlayBillingTypes";
import AdminSlackService, {ChannelName} from "@admin/services/AdminSlackService";
import {isNull, stringifyJSON} from "@shared/util/ObjectUtil";
import GooglePlayService, {GoogleSubscriptionPurchase} from "@admin/services/GooglePlayService";
import AdminSubscriptionProductService from "@admin/services/AdminSubscriptionProductService";
import SubscriptionProduct from "@shared/models/SubscriptionProduct";
import {formatDateTime} from "@shared/util/DateUtil";


export default class GooglePlayBillingEventHandler {
    notification: DeveloperNotification;
    logger = new Logger("GooglePlayBillingEventHandler");
    slackChannel = ChannelName.subscription_status;

    purchase: GoogleSubscriptionPurchase | undefined;
    cactusSubscriptionProduct: SubscriptionProduct | undefined;

    get productId(): string | undefined {
        return this.notification.subscriptionNotification?.subscriptionId;
    }

    get startDate(): Date | undefined {
        return this.purchase?.startTimeMillis ? new Date(Number(this.purchase.startTimeMillis)) : undefined;
    }

    get expiryDate(): Date | undefined {
        return this.purchase?.expiryTimeMillis ? new Date(Number(this.purchase.expiryTimeMillis)) : undefined;
    }

    get userCancellationTime(): Date | undefined {
        return this.purchase?.userCancellationTimeMillis ? new Date(Number(this.purchase.userCancellationTimeMillis)) : undefined;
    }

    get isCancelled(): boolean {
        return !isNull(this.purchase?.cancelReason)
    }

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

        this.purchase = await GooglePlayService.getSharedInstance().getPurchaseFromNotification(this.notification);
        this.cactusSubscriptionProduct = await AdminSubscriptionProductService.getSharedInstance().getByAndroidProductId({androidProductId: this.productId});


        await this.sendSlackMessage();
    }

    async sendSlackMessage() {
        const cactusSubscriptionProduct = this.cactusSubscriptionProduct;
        const purchase = this.purchase;
        const messages: string[] = [];
        if (cactusSubscriptionProduct) {
            messages.push(`*Product*: \`${cactusSubscriptionProduct.subscriptionTier}\` - \`${cactusSubscriptionProduct.displayName}\` - \`${this.productId}\``);
        }

        if (!purchase) {
            await AdminSlackService.getSharedInstance().uploadTextSnippet({
                message: "\`[GooglePlayBillingEventHandler]\` :boom: Unable to get purchase from notification.\n" + messages.join("\n"),
                data: stringifyJSON({notification: this.notification}, 2),
                fileType: "json",
                filename: "google-play-billing-listeners-error.json",
                channel: this.slackChannel
            });
            this.logger.error("Failed to get a purchase from the google play api");
            return;
        }

        const isCancelled = this.isCancelled;
        if (isCancelled) {
            messages.push("*Cancellation Reason*: " + getCancelReasonDescription(purchase.cancelReason));
        }
        const orderId = purchase.orderId;
        if (orderId) {
            messages.push(`*OrderID*: ${orderId}`);
        }
        const purchasePriceCents = purchase.priceAmountMicros ? Number(purchase.priceAmountMicros) / 10000 : undefined;
        if (purchasePriceCents) {
            messages.push(`*Purchase Price*: ${(purchasePriceCents / 100).toFixed(2)} ${purchase.priceCurrencyCode ?? "USD"}`);
        }

        if (this.userCancellationTime) {
            messages.push(`*User Cancelled Date*: ${formatDateTime(this.userCancellationTime, {timezone: "America/Denver"})}`);
        }

        const isAcknowledged = purchase.acknowledgementState === 1;
        if (!isAcknowledged) {
            messages.push("*Acknowledgement*: Purchase as not been acknowledged yet");
        }

        const isAutoRenewing = purchase.autoRenewing ?? false;
        messages.push(`*Auto Renewing*: \`${isAutoRenewing ? "Yes" : "No"}\``);

        if (this.startDate) {
            messages.push(`*Start Date*: ${formatDateTime(this.startDate, {timezone: "America/Denver"})}`);
        }

        if (this.expiryDate) {
            messages.push(`*Expiry Date*: ${formatDateTime(this.expiryDate, {timezone: "America/Denver"})}`);
        }

        await AdminSlackService.getSharedInstance().uploadTextSnippet({
            message: `\`[GooglePlayBillingEventHandler]\` ${getSubscriptionNotificationDescription(this.notification.subscriptionNotification?.notificationType)}\n${messages.join("\n")}`,
            data: stringifyJSON({notification: this.notification, purchase,}, 2),
            fileType: "json",
            filename: "google-play-billing-listeners-success.json",
            channel: this.slackChannel
        });

        return;
    }

}