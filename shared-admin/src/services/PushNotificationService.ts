import CactusMember, {PromptSendTime} from "@shared/models/CactusMember";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import * as admin from "firebase-admin";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import * as Sentry from "@sentry/node";
import PromptContent from "@shared/models/PromptContent";
import {
    MessagingErrorCode,
    NewPromptNotificationResult,
    RefreshTopicsResult,
    SendPushBatchResult,
    SendPushResult,
    TopicSubscribeResult,
    TopicUnsubscribeResult
} from "@admin/PushNotificationTypes";
import SentPrompt, {PromptSendMedium} from "@shared/models/SentPrompt";

export const PROMPT_CUSTOM_NOTIF_TOPIC_PREFIX = "custom_prompt_notif";

/**
 * See error codes in the [Firebase Documentation](https://firebase.google.com/docs/cloud-messaging/send-message#admin)
 */
export default class PushNotificationService {
    protected static sharedInstance: PushNotificationService;
    private messaging: admin.messaging.Messaging;

    static getSharedInstance(): PushNotificationService {
        if (!PushNotificationService.sharedInstance) {
            throw new Error("PushNotificationService has not been initialized. Be sure to initialize before using.")
        }

        return PushNotificationService.sharedInstance;
    }

    static initialize() {
        PushNotificationService.sharedInstance = new PushNotificationService();
    }

    constructor() {
        this.messaging = admin.messaging();
    }

    async sendNewPromptPushIfNeeded(options: {
        sentPrompt: SentPrompt,
        promptContent?: PromptContent,
        prompt?: ReflectionPrompt,
        member: CactusMember,
    }): Promise<NewPromptNotificationResult | undefined> {
        const {sentPrompt, prompt, promptContent, member} = options;

        if (sentPrompt.completed) {
            return {attempted: false, alreadyAnswered: true};
        }

        if (!sentPrompt.containsMedium(PromptSendMedium.PUSH)) {
            return await this.sendPromptNotification({
                member,
                prompt,
                promptContent
            });
        }
        return;
    }

    async sendPromptNotification(options: { member: CactusMember, prompt?: ReflectionPrompt, promptContent?: PromptContent }): Promise<NewPromptNotificationResult> {
        let attempted = false;
        try {
            const {member, prompt} = options;
            let {promptContent} = options;
            if (!member.fcmTokens || !member.fcmTokens.length) {
                console.log("Member doesn't have any device tokens. Returning");
                return {attempted: false, error: "Member doesn't have any device tokens"}
            }

            if (!prompt && !promptContent) {
                return {attempted: false, error: "No prompt or prompt content provided. Can not process message."};
            }

            const promptContentEntryId = prompt?.promptContentEntryId;
            if (!promptContent && promptContentEntryId) {
                promptContent = await AdminPromptContentService.getSharedInstance().getByEntryId(promptContentEntryId);
            }

            if (!promptContent) {
                console.warn("No prompt content found, can't send push");
                return {attempted: false, error: "Unable to find the prompt content. Can not process message"};
            }

            const data: admin.messaging.DataMessagePayload = {};

            let title = `Today's Prompt`;
            let body = `${prompt?.question || ""}`;
            // let imageUrl: string | undefined = undefined;
            title = promptContent.subjectLine || title;

            const firstContent = promptContent.content && promptContent.content.length > 0 && promptContent.content[0];
            if (firstContent && firstContent.text) {
                body = firstContent.text
            }

            if (promptContentEntryId) {
                data.promptContentEntryId = promptContentEntryId
            }

            const promptId = prompt?.id || promptContent?.promptId;
            if (promptId) {
                data.promptId = promptId;
            }

            const payload: admin.messaging.MessagingPayload = {
                notification: {
                    title: title,
                    body: body,
                    badge: "1",
                },
                data
            };

            const tokens = member.fcmTokens || [];
            if (tokens.length === 0) {
                console.log(`Member ${member.email} has no FCM Tokens. Not attempting a push`);
                return {attempted: false};
            }
            const batchResult = await this.sendMulticastToMember({member, payload, tokens});

            return {
                attempted: batchResult.firebaseResponse !== undefined,
                error: batchResult.error,
                atLeastOneSuccess: (batchResult.firebaseResponse?.successCount ?? 0) > 0,
                result: {
                    numSuccess: batchResult.firebaseResponse?.successCount ?? 0,
                    numError: batchResult.firebaseResponse?.failureCount ?? 0,
                }
            };
        } catch (error) {
            console.error("A runtime error occurred while trying to send a push notification", error);
            Sentry.captureException(error);
            return {
                attempted,
                error: "An unexpected error occurred while attempting to send push noticiations"
            };

        }
    }

    async sendMulticastToMember(options: { member: CactusMember, tokens: string[], payload: admin.messaging.MessagingPayload }): Promise<SendPushBatchResult> {
        const {tokens, payload, member} = options;
        try {
            const result = await this.messaging.sendMulticast({
                tokens,
                data: payload.data,
                notification: payload.notification
            });
            return {firebaseResponse: result};
        } catch (error) {
            console.error(`Failed to send the multicast push notification to ${member?.id} ${member?.email}:`, error.code ? error.code : error);
            return {error};
        }
    }

    async sendPush(options: { token: string, payload: admin.messaging.MessagingPayload, member?: CactusMember }): Promise<SendPushResult> {
        const {token, payload, member} = options;
        try {
            const result = await this.messaging.sendToDevice(token, payload);
            console.log("Send Message Result", result);
            return {token, success: true};

        } catch (error) {
            console.error(`Failed to send the push notification to ${member?.id} ${member?.email}:`, error.code ? error.code : error);
            Sentry.captureException(error);
            return {
                success: false,
                token,
                error: `Failed to send the push notification to ${member?.id} ${member?.email}: ${error.code ? error.code : error} `
            }
        }
    }

    /**
     * Unsubscribes every FCM Token on the cactus member from the provided topic
     * @param {String[]} options.topics - the topics to process
     * @param {String[]} options.tokens - the FCM tokens to process
     * @param {String} options.prefix - the prefix to match the topics to unsubscribe. Uses a "startsWith" match.
     * @param {string} options.email - the email of the member, useful for logging purposes
     * @param {string} options.memberId - the ID of the cactus member that is being proceessed, useful for logging purposes
     * @return {Promise<TopicUnsubscribeResult[]>}
     */
    async unsubscribeFromTopics(options: {
        topics: string[],
        tokens: string[],
        prefix: string,
        email?: string,
        memberId?: string
    }): Promise<TopicUnsubscribeResult[]> {
        const {topics: inputTopics, tokens, prefix, email, memberId} = options;
        const results: TopicUnsubscribeResult[] = [];
        // let topics = member.fcmTopicSubscriptions || [];
        const topics = inputTopics.filter(t => {
            t.startsWith(prefix)
        });
        // const tokens = member.fcmTokens || [];
        if (topics.length === 0) {
            console.log(`member ${email} (${memberId}) has no subscribed topics. FCMTokens.length = ${tokens.length}. Not processing`);
            return results;
        }

        if (tokens.length === 0) {
            console.log(`member ${email} (${memberId}) has no FCK tokens. Topics.length = ${topics.length}. Not processing`);
            return results;
        }

        const tasks = topics.map(topic => new Promise<TopicUnsubscribeResult>(async resolve => {
                const result = new TopicUnsubscribeResult(topic);
                try {
                    const serverResponse = await this.messaging.unsubscribeFromTopic(tokens, topic);
                    console.log(`Unsubscribe server response for ${email} (${memberId})`, serverResponse);
                    result.firebaseResponse = serverResponse;
                } catch (error) {
                    console.error(`Failed to unsubscribe ${email} (${memberId}) from topic "${topic}"`);
                    result.error = error;
                }

                resolve(result);
                return;
            })
        );
        return await Promise.all(tasks);
    }

    /**
     * Subscribes all FCM Tokens on the cactus member to the given topic.
     * This will NOT add the topic to the member's subscription array.
     *
     * @param {{member: CactusMember, topic: string}} opts
     * @param {string} [opts.memberId] - useful for logging
     * @param {string} [opts.email] - useful for logging
     * @param {string[]} opts.tokens - the FCM tokens to subscribe to the new topic
     * @return {Promise<void>}
     */
    async subscribeToTopic(opts: {
        tokens: string[],
        memberId?: string,
        email?: string,
        topic: string
    }): Promise<TopicSubscribeResult> {
        const {tokens, memberId, email, topic} = opts;
        const result = new TopicSubscribeResult(topic);

        result.tokens = tokens;
        if (tokens.length === 0) {
            console.log(`No tokens to subscribe for member ${email} (${memberId})`);
            return result;
        }
        try {
            console.log(`Subscribing member ${email} (${memberId} to topic ${topic}`);
            result.firebaseResponse = await this.messaging.subscribeToTopic(tokens, topic);
            return result;
        } catch (error) {
            console.error(`Failed to subscribe ${email} (${memberId}) to topic "${topic}"`, error);
            result.error = error;
            return result
        }
    }

    static getTopicForSendTimeUTC(sendTime: PromptSendTime): string {
        const {hour, minute} = sendTime;
        return `${PROMPT_CUSTOM_NOTIF_TOPIC_PREFIX}_${hour}_${minute}`;
    }

    /**
     * Refreshes the topics and FCM tokesn associated with a member. Does not update the member object.
     * @param {{topic: String, fcmTokens: string[], memberId: string, email: string, currentTopics: string[]}} options
     * @return {Promise<RefreshTopicsResult>}
     */
    async refreshPromptTopics(options: {
        topic: string,
        currentTopics: string[],
        fcmTokens: string[],
        memberId?: string,
        email?: string
    }): Promise<RefreshTopicsResult> {
        const {topic, fcmTokens, memberId, email, currentTopics} = options;

        //create a copy of the tokens that were passed in
        const tokens = [...fcmTokens];
        const refreshResult = new RefreshTopicsResult({topic, fcmTokens: tokens});
        try {
            // Unsubscribe from old Prompt Notification Topics that match the prefix.
            const unsubscribeResult = await this.unsubscribeFromTopics({
                tokens,
                topics: [...currentTopics],
                memberId,
                email,
                prefix: PROMPT_CUSTOM_NOTIF_TOPIC_PREFIX
            });
            console.log("unsubscribe result", JSON.stringify(unsubscribeResult, null, 2));

            const unsubscribedTopics: string[] = [];
            unsubscribeResult.forEach(r => {
                if ((r.firebaseResponse?.successCount ?? 0) > 0) {
                    unsubscribedTopics.push(r.topic);
                    refreshResult.removedTopics.push(r.topic);
                }
            });

            // set up a list of the topics the member is currently subscribed to
            // by removing the ones that successfully unsubscribed
            const topics = currentTopics.filter(t => !unsubscribedTopics.includes(t));


            // Subscribe to the new topic
            const subscribeResult = await this.subscribeToTopic({
                tokens,
                topic
            });
            console.log(`Subscribe result to ${topic} for ${email} (${memberId})`, JSON.stringify(subscribeResult));

            if ((subscribeResult.firebaseResponse?.successCount ?? 0) > 0) {
                topics.push(topic);
                refreshResult.addedTopics.push(topic);
            }

            // handle expired/errored tokens from the subscribe result
            const invalidatedTokens: string[] = [];
            subscribeResult.firebaseResponse?.errors.forEach(error => {
                const tokenIndex = error.index;
                const code = error.error.code as MessagingErrorCode;
                switch (code) {
                    case MessagingErrorCode.registration_token_not_registered:
                        const removed = tokens.splice(tokenIndex, 1);
                        invalidatedTokens.push(...removed);
                        break;
                    default:
                        break;
                }
            });
            refreshResult.currentTopics = Array.from(new Set(topics));
            refreshResult.validFcmTokens = Array.from(new Set(tokens));

            refreshResult.unsubscribeResults = unsubscribeResult;
            refreshResult.removedTokens = invalidatedTokens;
            refreshResult.topicSubscribeResult = subscribeResult;
            refreshResult.success = true;
        } catch (error) {
            console.error("Failed to refresh member topics", error);
            refreshResult.error = error;
        }
        return refreshResult;
    }
}