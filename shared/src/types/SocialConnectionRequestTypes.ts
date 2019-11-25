export interface SocialConnectionRequestNotification {
    socialConnectionRequestId: string,
    toEmail: string
}

export interface SocialConnectionRequestNotificationResult {
    success: boolean,
    error?: string | object
}