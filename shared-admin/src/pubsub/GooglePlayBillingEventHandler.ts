import Logger from "@shared/Logger";
import {
    DeveloperNotification,
    getCancelReasonDescription,
    getSubscriptionNotificationDescription, getSubscriptionNotificationTypeName
} from "@shared/api/GooglePlayBillingTypes";
import AdminSlackService, {ChannelName} from "@admin/services/AdminSlackService";
import {isNull, stringifyJSON} from "@shared/util/ObjectUtil";
import GooglePlayService, {GoogleSubscriptionPurchase} from "@admin/services/GooglePlayService";
import AdminSubscriptionProductService from "@admin/services/AdminSubscriptionProductService";
import SubscriptionProduct from "@shared/models/SubscriptionProduct";
import {formatDateTime} from "@shared/util/DateUtil";
import Payment from "@shared/models/Payment";
import AdminPaymentService from "@admin/services/AdminPaymentService";
import {isBlank} from "@shared/util/StringUtil";
import CactusMember from "@shared/models/CactusMember";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";


export default class GooglePlayBillingEventHandler {
    notification: DeveloperNotification;
    logger = new Logger("GooglePlayBillingEventHandler");
    slackChannel = ChannelName.subscription_status;

    subscriptionPurchase: GoogleSubscriptionPurchase | undefined;
    cactusSubscriptionProduct: SubscriptionProduct | undefined;
    existingPayments: Payment[] | undefined;
    memberId: string | undefined;
    member?: CactusMember | undefined;

    get productId(): string | undefined {
        return this.notification.subscriptionNotification?.subscriptionId;
    }

    get startDate(): Date | undefined {
        return this.subscriptionPurchase?.startTimeMillis ? new Date(Number(this.subscriptionPurchase.startTimeMillis)) : undefined;
    }

    get expiryDate(): Date | undefined {
        return this.subscriptionPurchase?.expiryTimeMillis ? new Date(Number(this.subscriptionPurchase.expiryTimeMillis)) : undefined;
    }

    get userCancellationTime(): Date | undefined {
        return this.subscriptionPurchase?.userCancellationTimeMillis ? new Date(Number(this.subscriptionPurchase.userCancellationTimeMillis)) : undefined;
    }

    get isCancelled(): boolean {
        return !isNull(this.subscriptionPurchase?.cancelReason)
    }

    get purchaseToken(): string | undefined {
        return this.notification.subscriptionNotification?.purchaseToken;
    }

    constructor(payload: DeveloperNotification) {
        this.notification = payload;
    }


    async process(): Promise<void> {
        this.logger.info("Starting GooglePlayBillingEventHandler");
        await this.setupData();
        await this.sendSlackMessage();
    }

    async setupData(): Promise<void> {
        const token = this.purchaseToken;
        if (!token) {
            this.logger.error("No token was found on the notification object");
            return;
        }
        this.logger.info(`Handling purchase token ${token}`);

        const [subscriptionPurchase, cactusSubscriptionProduct, existingPayments] = await Promise.all([
            GooglePlayService.getSharedInstance().getPurchaseFromNotification(this.notification),
            AdminSubscriptionProductService.getSharedInstance().getByAndroidProductId({androidProductId: this.productId}),
            AdminPaymentService.getSharedInstance().getByGooglePurchaseToken(token)
        ]);

        this.subscriptionPurchase = subscriptionPurchase;
        this.cactusSubscriptionProduct = cactusSubscriptionProduct;
        this.existingPayments = existingPayments;


        const memberId = existingPayments?.find(payment => !isBlank(payment.memberId))?.memberId;
        this.memberId = memberId;
        if (!memberId) {
            this.logger.warn("\n\n****************\nUnable to determine a member ID from existing payments... not sure who to associate this payment to.\n****************\n\n");
        } else {
            this.member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
        }

    }

    async sendSlackMessage() {
        const cactusSubscriptionProduct = this.cactusSubscriptionProduct;
        const subscriptionPurchase = this.subscriptionPurchase;
        const messages: string[] = [];
        const memberId = this.memberId;

        // this.notification?.noti
        if (cactusSubscriptionProduct) {
            messages.push(`*Product*: ${cactusSubscriptionProduct.subscriptionTier} | ${cactusSubscriptionProduct.displayName} | ${this.productId}`);
        }

        if (!subscriptionPurchase) {
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

        if (!memberId) {
            await AdminSlackService.getSharedInstance().sendMessage(this.slackChannel, {
                text: ":warning: Unable to find the member associated with google payment.",
                attachments: [{
                    color: "danger",
                    fields: [{
                        title: "Purchase Token",
                        value: `\`\`\`${this.purchaseToken}\`\`\``
                    }]
                }]
            })
        } else {
            messages.push(`*Cactus Member ID*: ${memberId}`);
            messages.push(`*Email*: ${this.member?.email ?? "unknown"}`)
        }

        const isCancelled = this.isCancelled;
        if (isCancelled) {
            messages.push("*Cancellation Reason*: " + getCancelReasonDescription(subscriptionPurchase.cancelReason));
        }
        const orderId = subscriptionPurchase.orderId;
        if (orderId) {
            messages.push(`*OrderID*: ${orderId}`);
        }
        const purchasePriceCents = subscriptionPurchase.priceAmountMicros ? Number(subscriptionPurchase.priceAmountMicros) / 10000 : undefined;
        if (purchasePriceCents) {
            messages.push(`*Purchase Price*: ${(purchasePriceCents / 100).toFixed(2)} ${subscriptionPurchase.priceCurrencyCode ?? "USD"}`);
        }

        if (this.userCancellationTime) {
            messages.push(`*User Cancelled Date*: ${formatDateTime(this.userCancellationTime, {timezone: "America/Denver"})}`);
        }

        const isAcknowledged = subscriptionPurchase.acknowledgementState === 1;
        if (!isAcknowledged) {
            messages.push("*Acknowledgement*: Purchase as not been acknowledged yet");
        }

        const isAutoRenewing = subscriptionPurchase.autoRenewing ?? false;
        messages.push(`*Auto Renewing*: \`${isAutoRenewing ? "Yes" : "No"}\``);

        if (this.startDate) {
            messages.push(`*Start Date*: ${formatDateTime(this.startDate, {timezone: "America/Denver"})}`);
        }

        if (this.expiryDate) {
            messages.push(`*Expiry Date*: ${formatDateTime(this.expiryDate, {timezone: "America/Denver"})}`);
        }

        const notificationType = this.notification.subscriptionNotification?.notificationType;
        const notificationTypeName = getSubscriptionNotificationTypeName(notificationType);
        await AdminSlackService.getSharedInstance().uploadTextSnippet({
            message: `:android: *[GooglePlayBillingEventHandler]* \`${notificationTypeName}\`\n_${getSubscriptionNotificationDescription(notificationType)}_\n\n${messages.join("\n")}`,
            data: stringifyJSON({notification: this.notification, purchase: subscriptionPurchase,}, 2),
            fileType: "json",
            filename: "google-play-billing-listeners-success.json",
            channel: this.slackChannel
        });

        return;
    }

}