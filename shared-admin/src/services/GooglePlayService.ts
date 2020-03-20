import {CactusConfig} from "@shared/CactusConfig";
import {androidpublisher_v3, google} from "googleapis";
import Logger from "@shared/Logger";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import {DeveloperNotification} from "@shared/api/GooglePlayBillingTypes";
import Androidpublisher = androidpublisher_v3.Androidpublisher;
export import GoogleSubscriptionPurchase = androidpublisher_v3.Schema$SubscriptionPurchase;

interface GetSubscriptionParams {
    subscriptionId: string;
    token: string;
    packageName: string;
}

export default class GooglePlayService {
    protected static sharedInstance: GooglePlayService;
    logger = new Logger("GooglePlayService");
    config: CactusConfig;
    publisherClient: Androidpublisher

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
            const {packageName, subscriptionNotification} = notification;
            if (!subscriptionNotification) {
                this.logger.info("No subscription notification found on the developer notification. ");
                return undefined;
            }
            const {purchaseToken, subscriptionId} = subscriptionNotification;
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

}