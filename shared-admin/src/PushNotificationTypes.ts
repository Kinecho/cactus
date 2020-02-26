export interface NewPromptNotificationResult {
    result?: {
        numSuccess: number,
        numError: number,
    },
    atLeastOneSuccess?: boolean,
    attempted: boolean,
    error?: string,
    alreadyAnswered?: boolean,
    notAvailbleToTier?: boolean
}

export interface SendPushResult {
    success: boolean,
    token: string,
    error?: string,
}
