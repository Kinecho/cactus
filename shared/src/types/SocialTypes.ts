export interface SocialActivityFeedRequest {
    memberId: string
}

export interface SocialActivityFeedResponse {
    success: boolean,
    message?: string,
    results?: SocialActivityFeedEvent[],
    error?: any
}

export enum SocialActivityType {
    ReflectionResponse = "ReflectionResponse"
}

export interface SocialActivityFeedEvent {
    eventType?: SocialActivityType,
    eventId?: string,
    occurredAt?: Date,
    memberId?: string
    payload?: ReflectionResponsePayload
}

export interface ReflectionResponsePayload {
    promptId?: string,
    promptQuestion?: string
}

export interface ActivitySummaryResponse {
    unseenCount: number,
    lastFriendActivityDate?: Date,
}