import {
    AppleErrorCode,
    AppleReceiptResponseRawBody,
    isAppleReceiptResponseRawBody,
    VerifyReceiptParams,
    VerifyReceiptResult
} from "@shared/api/AppleApi";
import {CactusConfig} from "@shared/CactusConfig";
import axios from "axios";
import Logger from "@shared/Logger";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import {isAxiosError} from "@shared/api/ApiTypes";

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

    async verifyReceipt(receipt: VerifyReceiptParams): Promise<VerifyReceiptResult> {
        const result: VerifyReceiptResult = {success: false};

        //First, try prod
        const prodResponse = await this.sendToApple({
            data: receipt.receiptData,
            excludeOldTransactions: true,
            sandbox: false
        });
        let appleResponse = prodResponse;
        if (prodResponse?.environment === "Sandbox" || prodResponse?.status === AppleErrorCode.receipt_is_test_environment) {
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
        result.success = appleResponse?.status === 0;
        return result;
    }
}