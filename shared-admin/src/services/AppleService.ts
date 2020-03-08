import {
    AppleFulfillmentResult,
    AppleReceiptResponseRawBody,
    isAppleReceiptResponseRawBody,
    ReceiptStatusCode,
    VerifyReceiptParams,
    VerifyReceiptResult
} from "@shared/api/AppleApi";
import {CactusConfig} from "@shared/CactusConfig";
import axios from "axios";
import Logger from "@shared/Logger";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import {isAxiosError} from "@shared/api/ApiTypes";
import Payment from "@shared/models/Payment";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminPaymentService from "@admin/services/AdminPaymentService";
import AdminSubscriptionProductService from "@admin/services/AdminSubscriptionProductService";
import {getDefaultSubscription, getDefaultTrial} from "@shared/models/MemberSubscription";
import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";

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
    async sendToApple(options: { data: string, sandbox: boolean, excludeOldTransactions: boolean }): Promise<AppleReceiptResponseRawBody | undefined> {
        const {data, sandbox, excludeOldTransactions} = options;
        const url = sandbox ? this.config.ios.verify_receipt_sandbox_url : this.config.ios.verify_receipt_url;
        try {
            this.logger.info(`sending verify receipt to apple using sandbox=${sandbox}`);
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

    async verifyReceipt(options: { userId: string, receipt: VerifyReceiptParams }): Promise<VerifyReceiptResult> {
        const {userId, receipt} = options;
        this.logger.info("Verifying receipt for userId", userId);
        const result: VerifyReceiptResult = {success: false, isValid: false};

        //First, try prod
        const prodResponse = await this.sendToApple({
            data: receipt.receiptData,
            excludeOldTransactions: true,
            sandbox: false
        });
        let appleResponse = prodResponse;
        if (prodResponse?.environment === "Sandbox" || prodResponse?.status === ReceiptStatusCode.receipt_is_test_environment) {
            this.logger.info("receipt was a sandbox receipt, sending again with sandbox");
            const sandboxResponse = await this.sendToApple({
                data: receipt.receiptData,
                excludeOldTransactions: true,
                sandbox: true
            });
            console.log("got sandbox response", sandboxResponse);
            appleResponse = sandboxResponse;
        }

        console.log("Got apple receipt info from ", appleResponse?.environment, stringifyJSON(appleResponse));
        result.appleReceiptData = appleResponse;

        result.isValid = appleResponse?.status === ReceiptStatusCode.valid;
        console.log("verify receipt result", stringifyJSON(result, 2));

        if (appleResponse) {
            const fulfilResult = await this.fulfilReceipt({receipt: appleResponse, userId});
            this.logger.info("Fulfillment response", stringifyJSON(fulfilResult, 2));
            result.fulfillmentResult = fulfilResult;
            result.success = fulfilResult.success;
        } else {
            result.success = false;
        }

        return result;
    }

    /**
     * Get the latest purchased Apple Product ID from a receipt
     * @param {AppleReceiptResponseRawBody} receipt
     * @return {Promise<string | undefined>}
     */
    getAppleProductIdFromReceipt(receipt: AppleReceiptResponseRawBody): string | undefined {
        const [nextRenewal] = receipt.pending_renewal_info;
        const [lastInfo] = receipt.latest_receipt_info;
        return nextRenewal?.product_id ?? lastInfo?.product_id;
    }

    getOriginalTransactionId(receipt: AppleReceiptResponseRawBody): string | undefined {
        const [nextRenewal] = receipt.pending_renewal_info;
        const [lastInfo] = receipt.latest_receipt_info;
        return nextRenewal?.original_transaction_id ?? lastInfo?.original_transaction_id;
    }

    async fulfilReceipt(options: { userId: string, receipt: AppleReceiptResponseRawBody }): Promise<AppleFulfillmentResult> {
        const {userId, receipt} = options;
        const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(userId);

        const memberId = member?.id;
        if (!member || !memberId) {
            this.logger.error("No member ID was given when processing apple receipt");
            return {success: false, message: "No member ID was found"};
        }
        const result: AppleFulfillmentResult = {success: false};
        const appleProductId = this.getAppleProductIdFromReceipt(receipt);
        const subscriptionProduct = await AdminSubscriptionProductService.getSharedInstance().getByAppleProductId({
            appleProductId,
            onlyAvailableForSale: false
        });
        const subscriptionProductId = subscriptionProduct?.entryId;
        if (!subscriptionProductId) {
            result.success = false;
            result.message = "No subscription product could be found for apple id: " + appleProductId;
            this.logger.info("Unable to process fulfillment request", stringifyJSON(result, 2));
            return result;
        } else {
            this.logger.info("Fulfilling subscription for product id", subscriptionProductId);
        }

        const payment = Payment.fromAppleReceipt({
            receipt: receipt,
            memberId: memberId,
            subscriptionProductId: subscriptionProductId
        });
        await AdminPaymentService.getSharedInstance().save(payment);
        this.logger.info("Saved payment for apple receipt", stringifyJSON(payment, 2));

        const cactusSubscription = member.subscription ?? getDefaultSubscription();
        cactusSubscription.tier = subscriptionProduct?.subscriptionTier || SubscriptionTier.PLUS;
        cactusSubscription.subscriptionProductId = subscriptionProductId;
        cactusSubscription.appleOriginalTransactionId = this.getOriginalTransactionId(receipt);

        const trial = (cactusSubscription.trial || getDefaultTrial());
        trial.activatedAt = new Date();
        cactusSubscription.trial = trial;
        await AdminCactusMemberService.getSharedInstance().save(member, {setUpdatedAt: false});

        return result;
    }
}