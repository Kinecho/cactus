import { CactusConfig } from "@shared/CactusConfig";
import _axios, { AxiosInstance } from "axios";
import Logger from "@shared/Logger"
import { isAxiosError } from "@shared/api/ApiTypes";
import { stringifyJSON } from "@shared/util/ObjectUtil";

const logger = new Logger("RevenueCatService");

const Endpoints = {
    receipts: "/receipts",
    subscriberAttributes(memberId: string): string {
        return `/subscribers/${ memberId }/attributes`
    }
}

export default class RevenueCatService {
    static shared: RevenueCatService;

    static initialize(config: CactusConfig) {
        this.shared = new RevenueCatService(config)
    }

    config: CactusConfig;
    client: AxiosInstance;
    secretClient: AxiosInstance

    constructor(config: CactusConfig) {
        this.config = config;
        const secretToken = config.revenuecat.secret_key;
        const apiToken = config.revenuecat.public_key;
        this.secretClient = _axios.create({
            baseURL: "https://api.revenuecat.com/v1",
            headers: {
                'Authorization': `Bearer ${ secretToken }`,
                "Content-Type": "application/json",
            }
        });

        this.client = _axios.create({
            baseURL: "https://api.revenuecat.com/v1",
            headers: {
                'Authorization': `Bearer ${ apiToken }`,
                "Content-Type": "application/json",
            }
        });
    }

    headers = {
        platform: {
            stripe: { "X-Platform": "stripe" },
            ios: { "X-Platform": "ios" },
            android: { "X-Platform": "android" },
        }
    }

    /**
     * Save/Update a Google transaction in RevenueCat
     * @param {object} params - the configuration object for the request
     * @param {string} params.memberId - the ID of the member to link the receipt to
     * @param {string} params.sku - the Google Play SKU of this product
     * @param {string} params.token - the purchase token from Google
     * @param {boolean} params.isRestore - if this transaction/receipt was a restored purchase
     * @return {Promise<void>}
     */
    async updateGoogleSubscription(params: {
        memberId: string,
        token: string,
        sku: string,
        isRestore?: boolean,
    }): Promise<void> {
        const memberId = params.memberId;
        try {
            const response = await this.client.post(Endpoints.receipts, {
                app_user_id: params.memberId,
                fetch_token: params.token,
                product_id: params.sku,
                is_restore: params.isRestore ?? false,
            }, { headers: { ...this.headers.platform.android } });
            logger.info(`updateGoogleSubscription Response data: memberId ${params.memberId} | sku: ${params.sku}`, JSON.stringify(response.data, null, 2));
        } catch (error) {
            if (isAxiosError(error)) {
                logger.error(`Failed to update android subscription to RevenueCat for memberId: ${ memberId }`, error.response?.data ?? error);
            } else {
                logger.error(`Failed to update android subscription to RevenueCat for memberId: ${ memberId }`, error);
            }
            logger.error("Original google input params were", stringifyJSON(params));
        }
    }


    /**
     * Save/Update an Apple transaction in RevenueCat
     * @param {object} params - the configuration object for the request
     * @param {string} params.memberId - the ID of the member to link the receipt to
     * @param {string} params.encodedReceipt - the base64 encoded receipt object from Apple
     * @param {number} params.price - the numeric price value, in local currency
     * @param {string} params.currency - the currency the transaction occurred in. e.g. 'USD'
     * @param {string} params.productId - the Apple Product ID for this subscription.
     * @param {boolean} params.isRestore - if this transaction/receipt was a restored purchase
     * @return {Promise<void>}
     */
    async updateAppleSubscription(params: {
        memberId: string,
        encodedReceipt: string,
        /**
         * The price of the subscription, formatted in local currency dollars, like 4.99
         */
        price: number,
        /**
         * The currency of the purchase, such as USD
         */
        currency: string,
        /**
         * The apple product ID
         */
        productId?: string,
        isRestore?: boolean,
    }): Promise<void> {
        const memberId = params.memberId;
        try {
            const response = await this.client.post(Endpoints.receipts, {
                app_user_id: params.memberId,
                fetch_token: params.encodedReceipt,
                price: params.price,
                currency: params.currency,
                product_id: params.productId,
                is_restore: params.isRestore ?? false,
            }, { headers: { ...this.headers.platform.ios } });
            logger.info(`updateAppleSubscription Response data for memberId: ${ memberId }`, JSON.stringify(response.data, null, 2));
        } catch (error) {
            if (isAxiosError(error)) {
                logger.error(`Failed to update apple subscription to RevenueCat for memberId: ${ memberId }`, error.response?.data ?? error);
            } else {
                logger.error(`Failed to update apple subscription to RevenueCat for memberId: ${ memberId }`, error);
            }
            logger.error("Original input params were", stringifyJSON(params));
        }
    }

    async updateStripeSubscription(params: {
        memberId: string,
        subscriptionId: string
    }): Promise<void> {
        const memberId = params.memberId;
        try {
            const response = await this.client.post(Endpoints.receipts, {
                app_user_id: params.memberId,
                fetch_token: params.subscriptionId,
            }, { headers: { ...this.headers.platform.stripe } });
            logger.info("updateStripeSubscription Response data", JSON.stringify(response.data, null, 2));
        } catch (error) {
            if (isAxiosError(error)) {
                logger.error(`Failed to update stripe subscription to RevenueCat for memberId: ${ memberId }`, error.response?.data ?? error);
            } else {
                logger.error(`Failed to update stripe subscription to RevenueCat for memberId: ${ memberId }`, error);
            }
        }
    }

    async updateAttributes(params: { memberId: string, email?: string, name?: string }): Promise<void> {
        const { memberId, email, name } = params;
        try {
            const path = Endpoints.subscriberAttributes(memberId);
            const attributes: Record<string, { value: string | number }> = {};
            if (email) {
                attributes.$email = { value: email };
            }
            if (name) {
                attributes.$displayName = { value: name };
            }
            const response = await this.client.post(path, { attributes });
            logger.info("Update attributes success response", stringifyJSON(response.data));
        } catch (error) {
            if (isAxiosError(error)) {
                logger.error("Failed to update RevenueCat user attributes", error.response?.data ?? error);
            } else {
                logger.error("Failed to update RevenueCat user attributes", error);
            }
        }
    }
}