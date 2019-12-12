export interface SocialActivityFeedRequest {
  memberId: string
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