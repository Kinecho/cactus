import admin from "firebase-admin";
import MessagingTopicManagementResponse = admin.messaging.MessagingTopicManagementResponse;

export interface NewPromptNotificationResult {
    result?: {
        numSuccess: number,
        numError: number,
    },
    atLeastOneSuccess?: boolean,
    attempted: boolean,
    error?: string,
    alreadyAnswered?: boolean,
}

export interface SendPushResult {
    success: boolean,
    token: string,
    error?: string,
}

export interface SendPushBatchResult {
    firebaseResponse?: admin.messaging.BatchResponse
    error?: any
}

export class TopicUnsubscribeResult {
    topic: string;
    firebaseResponse?: MessagingTopicManagementResponse;
    error?: any;

    constructor(topic: string) {
        this.topic = topic;
    }

}

export class TopicSubscribeResult {
    topic: string;
    error?: any;
    firebaseResponse?: MessagingTopicManagementResponse;
    tokens: string[] = [];

    constructor(topic: string) {
        this.topic = topic;
    }
}

export class RefreshTopicsResult {
    inputTokens: string[];
    inputTopic: string;
    unsubscribeResults?: TopicUnsubscribeResult[];
    topicSubscribeResult?: TopicSubscribeResult;
    error?: any;
    removedTopics: string[] = [];
    addedTopics: string[] = [];
    removedTokens: string[] = [];

    validFcmTokens: string[] = [];
    currentTopics: string[] = [];
    success: boolean = false;
    constructor(args: {topic: string, fcmTokens: string[]}) {
        this.inputTokens = args.fcmTokens;
        this.inputTopic = args.topic;
    }

}

/**
 * See [https://firebase.google.com/docs/cloud-messaging/send-message#admin](Firebase Documentation) for more details on these error codes
 */
export enum MessagingErrorCode {
    invalid_argument = "messaging/invalid-argument",
    invalid_recipient = "messaging/invalid-recipient",
    invalid_payload = "messaging/invalid-payload",
    invalid_data_payload_key = "messaging/invalid-data-payload-key",
    payload_size_limit_exceeded = "messaging/payload-size-limit-exceeded",
    invalid_options = "messaging/invalid-options",
    invalid_registration_token = "messaging/invalid-registration-token",
    registration_token_not_registered = "messaging/registration-token-not-registered",
    invalid_package_name = "messaging/invalid-package-name",
    message_rate_exceeded = "messaging/message-rate-exceeded",
    device_message_rate_exceeded = "messaging/device-message-rate-exceeded",
    topics_message_rate_exceeded = "messaging/topics-message-rate-exceeded",
    too_many_topics = "messaging/too-many-topics",
    invalid_apns_credentials = "messaging/invalid-apns-credentials",
    mismatched_credential = "messaging/mismatched-credential",
    authentication_error = "messaging/authentication-error",
    server_unavailable = "messaging/server-unavailable",
    internal_error = "messaging/internal-error",
    unknown_error = "messaging/unknown-error",
}