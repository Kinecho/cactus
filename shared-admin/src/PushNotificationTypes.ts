export interface PromptNotificationResult {
    result?: {
        numSuccess: number,
        numError: number,
    },
    atLeastOneSuccess?: boolean,
    attempted: boolean,
    error?: string,
}

export interface SendPushResult {
    success: boolean,
    token: string,
    error?: string,
}
