import { CactusConfig } from "@admin/CactusConfig";
import _axios, { AxiosInstance } from "axios";
import Logger from "@shared/Logger"
import { isAxiosError } from "@shared/api/ApiTypes";
import { isNull, stringifyJSON } from "@shared/util/ObjectUtil";
import Payment from "@shared/models/Payment";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import CactusMember from "@shared/models/CactusMember";
import SubscriptionProduct from "@shared/models/SubscriptionProduct";
import AdminSubscriptionProductService from "@admin/services/AdminSubscriptionProductService";
import { getStripeId } from "@admin/util/AdminStripeUtils";
import {
    apiDomain,
    AttributesInput,
    getPlatformHeader,
    getSubscriberAttributes,
    processAttributeInputForUpdate,
    RevenueCatEndpoints
} from "@shared/api/RevenueCatApi";
import { AppType } from "@shared/types/DeviceTypes";

const logger = new Logger("RevenueCatService");


export default class AdminRevenueCatService {
    static shared: AdminRevenueCatService;

    hasFetchedProducts: boolean = false;
    cactusSubscriptionProductsById: Record<string, SubscriptionProduct | null> = {};

    static initialize(config: CactusConfig) {
        this.shared = new AdminRevenueCatService(config)
    }

    config: CactusConfig;
    client: AxiosInstance;
    secretClient: AxiosInstance

    constructor(config: CactusConfig) {
        this.config = config;
        const secretToken = config.revenuecat.secret_key;
        const apiToken = config.revenuecat.public_key;
        this.secretClient = _axios.create({
            baseURL: apiDomain,
            headers: {
                'Authorization': `Bearer ${ secretToken }`,
                "Content-Type": "application/json",
            }
        });

        this.client = _axios.create({
            baseURL: apiDomain,
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

    private async fetchCactusProducts() {
        const products = await AdminSubscriptionProductService.getSharedInstance().getAll();
        products.forEach(p => {
            this.cactusSubscriptionProductsById[p.entryId] = p;
        });
        this.hasFetchedProducts = true;
        return this.cactusSubscriptionProductsById;
    }

    private async getCactusProduct(entryId?: string): Promise<SubscriptionProduct | null | undefined> {
        if (!entryId) {
            return null;
        }

        if (!this.hasFetchedProducts) {
            await this.fetchCactusProducts()
        }

        const existing = this.cactusSubscriptionProductsById[entryId];
        if (existing === undefined) {
            const found = await AdminSubscriptionProductService.getSharedInstance().getByEntryId(entryId);
            this.cactusSubscriptionProductsById[entryId] = found ?? null;
        }

        return this.cactusSubscriptionProductsById[entryId];
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
            const response = await this.client.post(RevenueCatEndpoints.receipts, {
                app_user_id: params.memberId,
                fetch_token: params.token,
                product_id: params.sku,
                is_restore: params.isRestore ?? false,
            }, { headers: { ...this.headers.platform.android } });
            logger.info(`updateGoogleSubscription Response data: memberId ${ params.memberId } | sku: ${ params.sku }`, JSON.stringify(response.data, null, 2));
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
            const response = await this.client.post(RevenueCatEndpoints.receipts, {
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
            const response = await this.client.post(RevenueCatEndpoints.receipts, {
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

    async processApplePayment(payment: Payment): Promise<void> {
        logger.info("Processing payment", payment.id);
        const memberId = payment.memberId;
        const cactusProductId = payment.subscriptionProductId;
        const product = await this.getCactusProduct(cactusProductId);
        const price = payment.apple?.productPrice?.price ?? ((product?.priceCentsUsd ?? 0) / 100);
        const priceLocale = payment.apple?.productPrice?.priceLocale;
        let currency = "USD";
        if (priceLocale?.includes("@currency=")) {
            currency = priceLocale.split("@currency=")[1];
        }
        // const appleProductId = payment.apple?.unifiedReceipt?.latest_receipt_info
        const appleProductId = product?.appleProductId;

        const encodedReceipt = payment.apple?.raw?.latest_receipt;
        if (!encodedReceipt) {
            return;
        }

        logger.info(`updating apple subscription for memberId: ${ memberId } in revenuecat: price: ${ price } | currency: ${ currency }`);
        await AdminRevenueCatService.shared.updateAppleSubscription({
            memberId,
            encodedReceipt,
            price,
            currency,
            productId: appleProductId
        })
        const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
        if (member) {
            logger.info("Updating the member attributes in revenuecat");
            await this.updateSubscriberAttributes(member);
        }
    }

    /**
     * Get a customer from revenuecat, or create them if they don't exist in RevenueCat's sytem.
     * Pass the appType to update the last seen time of the user.
     * @param {boolean} params.updateLastSeen - set to FALSE if you do not want to update the last seen data.
     * Useful if you are fetching the member for information purposes
     *
     * @param {string} params.memberId - the Cactus Member ID to get/create
     * @param {AppType} params.appType - the type of App that the user was last seen using
     * @return {Promise<void>}
     */
    async updateLastSeen(params: { memberId: string, appType?: AppType, updateLastSeen: boolean }) {
        const { memberId, appType, updateLastSeen = true } = params;
        const headers = updateLastSeen ? getPlatformHeader(appType) : undefined;
        await this.client.get(RevenueCatEndpoints.subscriber(memberId), { headers: { ...headers } })
    }

    async updateSubscriberAttributes(member?: CactusMember) {
        if (!member) {
            return;
        }
        const attributes = getSubscriberAttributes(member);
        await this.updateAttributes(attributes);
    }


    /**
     * Set attributes on the subscriber in RevenueCat. Can pass any attributes as strings or numbers.
     * Null values or empty strings will clear the attribute;
     * @param {object} params
     * @param {string} params.memberId - the Cactus Member ID. Required.
     * @param {string} [params.email] - the email address of the member;
     * @param {string} [params.name] the display name of the member;
     *
     * @return {Promise<void>}
     */
    async updateAttributes(params?: AttributesInput): Promise<void> {
        if (!params) {
            return;
        }
        const { memberId } = params;
        try {
            const path = RevenueCatEndpoints.subscriberAttributes(memberId);
            const attributes = processAttributeInputForUpdate(params);
            logger.info("Setting attributes to", stringifyJSON(attributes, 2));

            const response = await this.client.post(path, { attributes });
            logger.info("Update attributes success response", stringifyJSON(response.data, 2));
        } catch (error) {
            if (isAxiosError(error)) {
                logger.error("Failed to update RevenueCat user attributes", error.response?.data ?? error);
            } else {
                logger.error("Failed to update RevenueCat user attributes", error);
            }
        }
    }

    async processStripePayment(payment: Payment): Promise<void> {
        logger.log("Processing payment", payment.id);
        const memberId = payment.memberId;
        const stripeSubscriptionId = getStripeId(payment.stripe?.checkoutSession?.subscription) ?? payment.stripe?.subscriptionId;
        if (!stripeSubscriptionId) {
            logger.info("Not processing member as there is no stripe subscription id", memberId);
            return;
        }

        const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
        logger.info(`updating stripe subscription for memberId: ${ memberId } | email: ${ member?.email ?? "" } in revenuecat with subscriptionId ${ stripeSubscriptionId }`);
        await AdminRevenueCatService.shared.updateStripeSubscription({
            memberId,
            subscriptionId: stripeSubscriptionId,
        })

        if (member) {
            logger.info("Updating the member attributes in revenuecat");
            await this.updateSubscriberAttributes(member);
        }
        logger.info("Finished processing member", memberId);
        return;
    }

    async processGooglePayment(payment: Payment): Promise<void> {
        logger.log("Processing payment", payment.id);
        const memberId = payment.memberId;
        const cactusProductId = payment.subscriptionProductId;
        const product = await this.getCactusProduct(cactusProductId);
        const token = payment.google?.token;
        if (!token) {
            logger.info("Not processing member as there is no token", memberId);
            return;
        }

        const sku = payment.google?.subscriptionProductId ?? product?.androidProductId;
        if (!sku) {
            logger.info(`Not processing member ${ memberId } as no SKU was found. PaymentID = ${ payment.id }`);
            return;
        }
        const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
        logger.info(`updating Android subscription for memberId: ${ memberId } | email: ${ member?.email ?? "" } in revenuecat with sku: ${ sku }`);
        await AdminRevenueCatService.shared.updateGoogleSubscription({
            memberId,
            token,
            sku,
        })

        if (member) {
            logger.info("Updating the member attributes in revenuecat");
            await this.updateSubscriberAttributes(member);
        }
        logger.info("Finished processing member", memberId);
        return;
    }

    async processPayments(payments: Payment[]): Promise<void> {
        const tasks = payments.map(payment => {
            if (!isNull(payment.apple)) {
                return this.processApplePayment(payment);
            }
            if (!isNull(payment.google)) {
                return this.processGooglePayment(payment);
            }

            if (!isNull(payment.stripe)) {
                return this.processStripePayment(payment);
            }
            return;
        })

        await Promise.all(tasks);
    }
}