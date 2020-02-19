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
    amount?: number|null|undefined,
}