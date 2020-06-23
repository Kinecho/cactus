import { CactusConfig } from "@admin/CactusConfig";
import { androidpublisher_v3, google } from "googleapis";
import Logger from "@shared/Logger";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import { DeveloperNotification } from "@shared/api/GooglePlayBillingTypes";
import Androidpublisher = androidpublisher_v3.Androidpublisher;
export import GoogleSubscriptionPurchase = androidpublisher_v3.Schema$SubscriptionPurchase;
import CactusMember from "@shared/models/CactusMember";
import AdminPaymentService from "@admin/services/AdminPaymentService";

interface GetSubscriptionParams {
    subscriptionId: string;
    token: string;
    packageName?: string;
}

interface CancelSubscriptionResult {
    didCancel: boolean,
    subscriptionFound: boolean,

}

export default class GooglePlayService {
    protected static sharedInstance: GooglePlayService;
    logger = new Logger("GooglePlayService");
    config: CactusConfig;
    publisherClient: Androidpublisher;
    defaultPackageName: string;

    static getSharedInstance(): GooglePlayService {
        if (!GooglePlayService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize GooglePlayService before using it");
        }
        return GooglePlayService.sharedInstance;
    }

    static initialize(config: CactusConfig) {
        GooglePlayService.sharedInstance = new GooglePlayService(config);
    }


    constructor(config: CactusConfig) {
        this.config = config;
        this.defaultPackageName = config.android_publisher.default_package_name;
        // const credentials = config.language.service_account;
        const credentials = config.android_publisher.service_account;
        const auth = new google.auth.JWT(
        credentials.client_id, undefined, credentials.private_key,
        ['https://www.googleapis.com/auth/androidpublisher']
        );
        this.publisherClient = new Androidpublisher({
            auth
        });
    }

    async getSubscriptionPurchase(params: GetSubscriptionParams): Promise<GoogleSubscriptionPurchase | undefined> {
        try {
            this.logger.info("Fetching subscription purchase with params: ", params);
            const response = await this.publisherClient.purchases.subscriptions.get({
                token: params.token,
                packageName: params.packageName,
                subscriptionId: params.subscriptionId,
            });
            this.logger.info("Fetched data from google purchases", stringifyJSON(response.data));
            return response.data
        } catch (error) {
            this.logger.error("Failed to get purchase from token", error);
            return;
        }
    }

    async getPurchaseFromNotification(notification: DeveloperNotification): Promise<GoogleSubscriptionPurchase | undefined> {
        try {
            const { packageName, subscriptionNotification } = notification;
            if (!subscriptionNotification) {
                this.logger.info("No subscription notification found on the developer notification. ");
                return undefined;
            }
            const { purchaseToken, subscriptionId } = subscriptionNotification;
            const androidSubscriptionPurchase = await this.getSubscriptionPurchase({
                token: purchaseToken,
                packageName,
                subscriptionId,
            });
            this.logger.info("Fetched data from google purchases", stringifyJSON(androidSubscriptionPurchase));
            return androidSubscriptionPurchase
        } catch (error) {
            this.logger.error("Failed to get purchase from token", error);
            return;
        }

    }

    async cancelSubscription(member: CactusMember): Promise<CancelSubscriptionResult> {
        const orderId = member.subscription?.googleOriginalOrderId;
        const orderToken = member.subscription?.googlePurchaseToken;

        if (!orderId || !orderToken || !member.hasActiveSubscription) {
            return { didCancel: false, subscriptionFound: false }
        }

        const purchases = await AdminPaymentService.getSharedInstance().getByGooglePurchaseToken(orderToken);
        const purchase = purchases.find(p => p.google?.subscriptionProductId);
        if (!purchase) {
            return { didCancel: false, subscriptionFound: false }
        }
        const params = {
            token: orderToken,
            subscriptionId: purchase.google?.subscriptionProductId,
            packageName: purchase.google?.packageName ?? this.defaultPackageName,
        };

        try {
            const cancelResult = await this.publisherClient.purchases.subscriptions.cancel(params);
            this.logger.info(`successfully canceled cancel google subscription. Status = ${ cancelResult.status }`, stringifyJSON(params));
            return { didCancel: true, subscriptionFound: true };
        } catch (error) {
            this.logger.error("Unable to cancel a google subscription with params", stringifyJSON(params));
            return { didCancel: false, subscriptionFound: false }
        }
    }
}