export interface SocialConnectionRequestNotification {
    socialConnectionRequestId: string,
    toEmail: string
}

export interface SocialConnectionRequestNotificationResult {
    success: boolean,
    message?: string,
    error?: string | object | undefined
}