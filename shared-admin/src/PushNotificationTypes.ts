export interface NewPromptNotificationPushResult {
    result?: {
        numSuccess: number,
        numError: number,
    },
    retryable?: boolean,
    atLeastOneSuccess?: boolean,
    attempted: boolean,
    error?: string,
    alreadyAnswered?: boolean,
    notAvailableToTier?: boolean
}

export interface SendPushResult {
    success: boolean,
    token: string,
    error?: string,
}
