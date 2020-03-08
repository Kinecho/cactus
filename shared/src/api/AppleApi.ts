import {isNull} from "@shared/util/ObjectUtil";

export interface VerifyReceiptParams {
    /**
     * Base 64 encoded receipt string
     */
    receiptData: string
}

export interface VerifyReceiptResult {
    success: boolean,
    message?: string
    error?: string,
    appleReceiptData?: AppleReceiptResponseRawBody,
}

export function isVerifyReceiptParams(input: any): input is VerifyReceiptParams {
    return !isNull(input) && !!(input as VerifyReceiptParams).receiptData;
}

export function isAppleReceiptResponseRawBody(input: any): input is AppleReceiptResponseRawBody {
    return !isNull(input) && !!(input as AppleReceiptResponseRawBody).status
}

/**
 * see [Apple Docs](https://developer.apple.com/documentation/appstorereceipts/responsebody)
 */
export interface AppleReceiptResponseRawBody {
    environment: "Sandbox" | "Production";
    "is-retryable": boolean;
    /**
     * Base64 encoded string
     */
    latest_receipt: string; //base 64 encoded string
    /**
     * An array that contains all in-app purchase transactions.
     * This excludes transactions for consumable products that have been marked as finished by your app.
     * Only returned for receipts that contain auto-renewable subscriptions.
     */
    latest_receipt_info: any;

    /**
     * In the JSON file, an array where each element contains the pending renewal
     * information for each auto-renewable subscription identified by the product_id.
     * Only returned for app receipts that contain auto-renewable subscriptions.
     */
    pending_renewal_info: any;

    /**
     * A JSON representation of the receipt that was sent for verification.
     */
    receipt: any;

    /**
     * Either 0 if the receipt is valid, or a status code if there is an error.
     * The status code reflects the status of the app receipt as a whole.
     * See status for possible status codes and descriptions.
     */
    status: number;
}

export enum AppleErrorCode {
    receipt_is_test_environment = 21007,
    internal_error = 21009,
    invalid_http_verb = 21000,
    deprecated_status_code = 21001,
    malformed_data = 21002,
    not_authorized = 21003,
    shared_secret_invalid = 21004,
    server_not_availalbe = 21005,
    subscription_expired = 21006,
    receipt_is_prod_environment = 21008,
    user_account_not_found_or_deleted = 21010,
}

export const AppleReceiptCode = {
    21000: "The request to the App Store was not made using the HTTP POST request method.",
    21001: "This status code is no longer sent by the App Store.",
    21002: "The data in the receipt-data property was malformed or missing.",
    21003: "The receipt could not be authenticated.",
    21004: "The shared secret you provided does not match the shared secret on file for your account.",
    21005: "The receipt server is not currently available.",
    21006: "This receipt is valid but the subscription has expired. When this status code is returned to your server, the receipt data is also decoded and returned as part of the response. Only returned for iOS 6-style transaction receipts for auto-renewable subscriptions.",
    21007: "This receipt is from the test environment, but it was sent to the production environment for verification.",
    21008: "This receipt is from the production environment, but it was sent to the test environment for verification.",
    21009: "Internal data access error. Try again later.",
    21010: "The user account cannot be found or has been deleted."
};