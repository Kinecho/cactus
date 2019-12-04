export interface SocialConnectionRequestNotification {
    socialConnectionRequestId: string,
    toEmail: string
}

export interface SocialConnectionRequestNotificationResult {
    success: boolean,
    toEmail: string,
    fromEmail: string,
    message?: string,
    error?: string | object | undefined
}