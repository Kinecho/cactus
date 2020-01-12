import admin from "firebase-admin";
import MessagingTopicManagementResponse = admin.messaging.MessagingTopicManagementResponse;
import CactusMember from "@shared/models/CactusMember";

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
    unsubscribeResults?: TopicUnsubscribeResult[];
    topicSubscribeResult?: TopicSubscribeResult;
    member: CactusMember;
    error?: any;
    removedTopics: string[] = [];
    addedTopics: string[] = [];
    removedTokens: string[] = [];
    constructor(member: CactusMember) {
        this.member = member;
    }

}