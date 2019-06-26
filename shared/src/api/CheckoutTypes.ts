export interface CreateSessionRequest {
    successUrl?: string,
    cancelUrl?: string,
    preOrder?: boolean,
    planId?: string,
    items?: [{
        name: string,
        currency: string,
        amount: number,
        quantity: number,
        description?: string,
        images?: string[],
    }]
}


export interface CreateSessionResponse {
    success: boolean,
    error?: any,
    sessionId?: string,
    amount?: number,
    productId?:string,
}