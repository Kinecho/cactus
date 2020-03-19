export interface CreateSessionRequest {
    subscriptionProductId: string,
    successUrl?: string,
    cancelUrl?: string,
}


export interface CreateSessionResponse {
    success: boolean,
    error?: any,
    unauthorized?: boolean,
    sessionId?: string,
    amount?: number | null | undefined,
}

export interface CreateSetupSubscriptionSessionRequest {
    successUrl?: string,
    cancelUrl?: string,
}

export interface CreateSetupSubscriptionSessionResponse {
    success: boolean,
    sessionId?: string,
    error?: string,
}

export interface AndroidFulfillParams {
    purchase: AndroidPurchase,
}

export interface AndroidFulfillResult {
    purchase?: AndroidPurchase,
    success: boolean,
    message?: string | undefined,
}


/**
 * Model used to communicate between the Android App and the Web App
 */
export interface AndroidPurchase {
    /**
     * A purchase token is a string that represents a buyer's entitlement to a product on Google Play.
     * It indicates that a Google user has paid for a specific product, represented by a SKU.
     */
    token: string;

    /**
     * The package name (bundle ID) of the Android app in which the purchase was completed.
     */
    packageName: string;

    /**
     * An order ID is a string that represents a financial transaction on Google Play.
     * This string is included in a receipt that is emailed to the buyer,
     * and third-party developers use the order ID to manage refunds in the Order Management section of the Google Play Console.
     * Order IDs are also used in sales and payout reports.
     */
    orderId: string;

    /**
     * The SKU that was purchased. Corresponds to Cactus.SubscriptionProduct.androidProductId
     */
    subscriptionProductId: string;
}

export interface AndroidPurchaseResult {
    success: boolean,
    message?: string | undefined
    purchase?: AndroidPurchase
}