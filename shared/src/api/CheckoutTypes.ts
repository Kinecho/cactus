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


export interface AndroidPurchase {
    token: string;
    packageName: string;
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