import {
    AppleCompletePurchaseRequest,
    AppleCompletePurchaseResult,
    AppleFulfillmentResult, AppleProductPrice,
    AppleServerNotificationBody,
    AppleTransactionInfo,
    AppleVerifiedReceipt,
    getCancellationReasonCodeFromExpirationIntent,
    getCurrentSubscriptionPeriodFromReceipt,
    getExpirationIntentDescription,
    getExpirationIntentFromNotification,
    getOriginalTransactionId,
    getOriginalTransactionIdFromServerNotification,
    HandleAppleNotificationResult,
    isAppleReceiptResponseRawBody,
    isReceiptInTrial,
    ReceiptStatusCode
} from "@shared/api/AppleApi";
import { CactusConfig } from "@admin/CactusConfig";
import axios from "axios";
import Logger from "@shared/Logger";
import { isNotNull, optionalStringToNumber, stringifyJSON } from "@shared/util/ObjectUtil";
import { isAxiosError } from "@shared/api/ApiTypes";
import Payment from "@shared/models/Payment";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminPaymentService from "@admin/services/AdminPaymentService";
import AdminSubscriptionProductService from "@admin/services/AdminSubscriptionProductService";
import { BillingPlatform, getDefaultSubscription, getDefaultTrial } from "@shared/models/MemberSubscription";
import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import AdminSlackService, { ChannelName } from "@admin/services/AdminSlackService";
import { formatDate } from "@shared/util/DateUtil";
import CactusMember from "@shared/models/CactusMember";
import AdminRevenueCatService from "@admin/services/AdminRevenueCatService";

export default class AppleService {
    protected static sharedInstance: AppleService;
    logger = new Logger("AppleService");
    config: CactusConfig;

    static getSharedInstance(): AppleService {
        if (!AppleService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AppleService before using it");
        }
        return AppleService.sharedInstance;
    }

    static initialize(config: CactusConfig) {
        AppleService.sharedInstance = new AppleService(config);
    }

    constructor(config: CactusConfig) {
        this.config = config;
    }

    /**
     * Make the api call to apple with receipt data
     * @param {{data: string, sandbox: boolean, excludeOldTransactions: boolean}} options
     * @return {Promise<any>}
     */
    async sendToApple(options: { data: string, sandbox: boolean, excludeOldTransactions: boolean }): Promise<AppleVerifiedReceipt | undefined> {
        const { data, sandbox, excludeOldTransactions } = options;
        const url = sandbox ? this.config.ios.verify_receipt_sandbox_url : this.config.ios.verify_receipt_url;
        try {
            this.logger.info(`sending verify receipt to apple using sandbox=${ sandbox }`);
            const response = await axios.post(url, {
                "receipt-data": data,
                password: this.config.ios.iap_shared_secret,
                "exclude-old-transactions": excludeOldTransactions,
            });
            if (isAppleReceiptResponseRawBody(response.data)) {
                return response.data;
            }
            this.logger.error("A success response was returned but the data did not conform to the apple receipt response body", stringifyJSON(response.data, 2));
            return undefined;
        } catch (error) {
            if (isAxiosError(error)) {
                const errorData = error.response?.data;
                this.logger.error("Failed to verify apple receipt", errorData);
                if (isAppleReceiptResponseRawBody(errorData)) {
                    return errorData;
                }
            } else {
                this.logger.error("Failed to verify apple receipt", error);
            }
            return;
        }
    }

    async decodeAppleReceipt(encodedReceipt: string): Promise<AppleVerifiedReceipt | undefined> {
        //First, try prod
        const prodResponse = await this.sendToApple({
            data: encodedReceipt,
            excludeOldTransactions: true,
            sandbox: false
        });
        let appleResponse = prodResponse;
        if (prodResponse?.environment === "Sandbox" || prodResponse?.status === ReceiptStatusCode.receipt_is_test_environment) {
            this.logger.info("receipt was a sandbox receipt, sending again with sandbox");
            const sandboxResponse = await this.sendToApple({
                data: encodedReceipt,
                excludeOldTransactions: true,
                sandbox: true
            });
            console.log("got sandbox response. Status = ", sandboxResponse?.status);
            appleResponse = sandboxResponse;
        }

        return appleResponse
    }

    async fulfillApplePurchase(options: { userId: string, receipt: AppleCompletePurchaseRequest }): Promise<AppleCompletePurchaseResult> {
        const { userId, receipt } = options;
        this.logger.info("Verifying receipt for userId", userId);
        const result: AppleCompletePurchaseResult = { success: false, isValid: false };
        const { receiptData, localePriceFormatted, price, priceLocale, restored } = receipt;
        const productPrice: AppleProductPrice = { price, priceLocale, localePriceFormatted };

        this.logger.info("Processing purchase request with options: ", stringifyJSON({
            localePriceFormatted,
            priceLocale,
            price,
            restored
        }));

        const appleResponse = await this.decodeAppleReceipt(receiptData);

        console.log("Got apple receipt info from ", appleResponse?.environment, `original transaction id = ${ getOriginalTransactionId(appleResponse) }`);
        result.appleReceiptData = appleResponse;

        result.isValid = appleResponse?.status === ReceiptStatusCode.valid;
        // console.log("verify receipt result", stringifyJSON(result, 2));

        if (appleResponse) {
            const fulfilResult = await this.fulfillReceipt({ receipt: appleResponse, userId, productPrice });
            this.logger.info("Fulfillment response", stringifyJSON(fulfilResult, 2));
            result.fulfillmentResult = fulfilResult;
            result.success = fulfilResult.success;
            result.message = fulfilResult.message;
        } else {
            result.success = false;
        }

        return result;
    }

    /**
     * Get the latest purchased Apple Product ID from a receipt
     * @param {AppleVerifiedReceipt} receipt
     * @return {Promise<string | undefined>}
     */
    getAppleProductIdFromReceipt(receipt: AppleVerifiedReceipt): string | undefined {
        const [nextRenewal] = receipt.pending_renewal_info;
        const [lastInfo] = receipt.latest_receipt_info;
        return nextRenewal?.product_id ?? lastInfo?.product_id;
    }

    async fulfillReceipt(options: { userId: string, receipt: AppleVerifiedReceipt, productPrice?: AppleProductPrice }): Promise<AppleFulfillmentResult> {
        const { userId, receipt, productPrice } = options;
        const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(userId);

        const memberId = member?.id;
        if (!member || !memberId) {
            this.logger.error("No member ID was given when processing apple receipt");
            return { success: false, message: "No member ID was found" };
        }
        const result: AppleFulfillmentResult = { success: false };
        const appleProductId = this.getAppleProductIdFromReceipt(receipt);

        const subscriptionProduct = await AdminSubscriptionProductService.getSharedInstance().getByAppleProductId({
            appleProductId,
            onlyAvailableForSale: false
        });

        let currency = "USD";
        let price: number = ((subscriptionProduct?.priceCentsUsd ?? 0) / 100);
        if (productPrice?.priceLocale) {
            currency = productPrice.priceLocale.split("currency=")[1] ?? "USD";
        }
        if (productPrice?.price) {
            price = productPrice.price;
        }

        //log to RevenueCat
        await AdminRevenueCatService.shared.updateAppleSubscription({
            memberId,
            encodedReceipt: receipt.latest_receipt,
            price,
            currency: currency
        })

        const now = Date.now();
        const validTransaction = receipt.latest_receipt_info.find(txn => {
            const expires = optionalStringToNumber(txn.expires_date_ms);
            if (expires) {
                return expires > now;
            }
            return false;
        });

        if (!validTransaction) {
            this.logger.info("No active subscription was found in the apple receipt transaction was found, can not fulfill the purchase");
            return {
                success: true,
                didFulfill: false,
                message: "No active subscription was found on the apple receipt. All transactions on the apple receipt are expired. Not fulfilling this purchase."
            };
        }

        result.subscriptionProduct = subscriptionProduct;
        const subscriptionProductId = subscriptionProduct?.entryId;

        try {
            const payment = Payment.fromAppleReceipt({
                receipt: receipt,
                memberId: memberId,
                subscriptionProductId: subscriptionProductId,
                productPrice: productPrice,
            });
            await AdminPaymentService.getSharedInstance().save(payment);
        } catch (error) {
            logger.error('failed to save payment to database. Original payload was', JSON.stringify(payment), error);
        }

        if (!subscriptionProductId) {
            result.success = false;
            result.message = "No subscription product could be found for apple id: " + appleProductId;
            this.logger.info("Unable to process fulfillment request", stringifyJSON(result, 2));
            return result;
        } else {
            this.logger.info("Fulfilling subscription for product id", subscriptionProductId);
        }


        // this.logger.info("Saved payment for apple receipt", stringifyJSON(payment, 2));
        const [latest_receipt_info] = receipt.latest_receipt_info;
        const cactusSubscription = member.subscription ?? getDefaultSubscription();
        cactusSubscription.tier = subscriptionProduct?.subscriptionTier || SubscriptionTier.PLUS;
        cactusSubscription.subscriptionProductId = subscriptionProductId;
        cactusSubscription.appleOriginalTransactionId = getOriginalTransactionId(receipt);

        const isOptOutTrial = isReceiptInTrial(receipt);
        const currentPeriod = getCurrentSubscriptionPeriodFromReceipt(receipt);
        if (isOptOutTrial) {
            if (!currentPeriod) {
                const errorMessage = `:boom: :ios: Apple Subscription: Unable to create opt out trial for ${ member.email } (${ memberId }) because one or both of start date or end date was not defined. Latest ReceiptInfo: \n${ stringifyJSON(latest_receipt_info, 2) }`
                this.logger.error(errorMessage);
                await AdminSlackService.getSharedInstance().sendChaChingMessage(errorMessage);
            }

            cactusSubscription.optOutTrial = {
                startedAt: currentPeriod?.startsAt,
                endsAt: currentPeriod?.expiresAt,
                billingPlatform: BillingPlatform.APPLE
            }
        } else {
            const trial = (cactusSubscription.trial || getDefaultTrial());
            if (trial.activatedAt) {
                this.logger.info(`User's trial was already activated at ${ trial.activatedAt?.toISOString() }, not updating it.`)
            }
            trial.activatedAt = trial.activatedAt ?? new Date();
            cactusSubscription.trial = trial;
        }


        member.subscription = cactusSubscription;
        await AdminCactusMemberService.getSharedInstance().save(member, { setUpdatedAt: false });
        result.success = true;
        result.didFulfill = true;
        return result;
    }

    async handleSubscriptionNotification(notification: AppleServerNotificationBody): Promise<HandleAppleNotificationResult> {
        this.logger.info("Apple Subscription Notification event received", stringifyJSON(notification, 2));

        const originalTransactionId = getOriginalTransactionIdFromServerNotification(notification);

        // const encodedReceipt = notification.unified_receipt.latest_receipt;
        // const decodedReceipt = await AppleService.getSharedInstance().decodeAppleReceipt(encodedReceipt);

        const [payment] = await AdminPaymentService.getSharedInstance().getByAppleOriginalTransactionId(originalTransactionId);
        const [latestReceiptInfo] = notification.unified_receipt?.latest_receipt_info as (AppleTransactionInfo | undefined)[];
        const productId = latestReceiptInfo?.product_id;
        const subscriptionProduct = await AdminSubscriptionProductService.getSharedInstance().getByAppleProductId({
            appleProductId: productId,
            onlyAvailableForSale: false
        });
        const memberId = payment?.memberId as string | undefined;
        const member = memberId ? await AdminCactusMemberService.getSharedInstance().getById(memberId) : undefined;

        //TODO: update the payment object
        payment.updateFromAppleNotification({ memberId, notification });
        await AdminPaymentService.getSharedInstance().save(payment);

        const isInTrial = latestReceiptInfo?.is_trial_period === "true";
        const isAutoRenew = notification.auto_renew_status === "true";
        const expirationIntent = getExpirationIntentFromNotification(notification);
        const expirationDescription = getExpirationIntentDescription(expirationIntent);
        const expiresDate = latestReceiptInfo?.expires_date_ms !== undefined ? new Date(Number(latestReceiptInfo.expires_date_ms)) : undefined;
        await AdminSlackService.getSharedInstance().uploadTextSnippet({
            channel: ChannelName.subscription_status,
            message: `:ios: ${ member?.email || memberId } Subscription status update from Apple\n` +
            `Product = \`${ subscriptionProduct?.displayName } (${ productId })\`\n` +
            `NotificationType = \`${ notification.notification_type }\`\n` +
            `In Trial = \`${ isInTrial ? "Yes" : "No" }\`\n` +
            `Period End Date = \`${ formatDate(expiresDate) }\`\n` +
            `Is Auto Renew = \`${ isAutoRenew ? "Yes" : "No" }\`\n` +
            `${ expirationDescription ? "Expiration Reason = " + expirationDescription : "" }`.trim(),
            data: JSON.stringify(notification, null, 2),
            filename: `member-${ memberId }-subscription-status-update-${ new Date().toISOString() }.json`,
            fileType: "json"
        });

        if (!isAutoRenew && member && expiresDate) {
            const subscription = member.subscription ?? getDefaultSubscription();
            subscription.cancellation = {
                initiatedAt: new Date(),
                accessEndsAt: expiresDate,
                reasonCode: getCancellationReasonCodeFromExpirationIntent(expirationIntent),
            };
            this.logger.info("set up subscription cancellation object as this subscription is no longer auto-renewable");
            member.subscription = subscription;
            await AdminCactusMemberService.getSharedInstance().save(member);
        } else if (isAutoRenew && member && !isNotNull(member.subscription?.cancellation)) {
            this.logger.info("removing the cancellation object as this subscription is now auto-renewable");
            await AdminCactusMemberService.getSharedInstance().deleteField(member, CactusMember.Field.subscriptionCancellation);
        }

        return { success: true };
    }
}