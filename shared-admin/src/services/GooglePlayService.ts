import {CactusConfig} from "@shared/CactusConfig";
import {androidpublisher_v3} from "googleapis";
import Androidpublisher = androidpublisher_v3.Androidpublisher;
import Schema$SubscriptionPurchase = androidpublisher_v3.Schema$SubscriptionPurchase;
import Logger from "@shared/Logger";
import {stringifyJSON} from "@shared/util/ObjectUtil";

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

        this.publisherClient = new Androidpublisher({
            // auth: credentials

        });


    }

    async getPurchaseFromToken(token: string): Promise<Schema$SubscriptionPurchase | undefined> {
        try {
            const response = await this.publisherClient.purchases.subscriptions.get({token});
            this.logger.info("Fetched data from google purchases", stringifyJSON(response.data));
            return response.data
        } catch (error) {
            this.logger.error("Failed to get purchase from token", error);
            return;
        }

    }

}