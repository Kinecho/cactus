export interface SocialActivityFeedRequest {
  memberId: string
}

export interface SocialActivityFeedResponse {
  success: boolean,
  message?: string,
  results?: SocialActivityFeedEvent[],
  error?: any
}

export interface SocialActivityFeedEvent {
  eventType?: string,
  eventId?: string,
  occurredAt?: Date,
  memberId?: string
  payload?: ReflectionResponsePayload
}

export interface ReflectionResponsePayload {
  promptId?: string,
  promptQuestion?: string
}