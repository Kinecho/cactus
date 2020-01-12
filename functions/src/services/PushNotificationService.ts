import CactusMember, {DEFAULT_PROMPT_SEND_TIME, PromptSendTime} from "@shared/models/CactusMember";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import * as admin from "firebase-admin";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import * as Sentry from "@sentry/node";
import PromptContent from "@shared/models/PromptContent";
import {
    NewPromptNotificationResult, RefreshTopicsResult, SendPushBatchResult,
    SendPushResult,
    TopicSubscribeResult,
    TopicUnsubscribeResult
} from "@admin/PushNotificationTypes";
import SentPrompt, {PromptSendMedium} from "@shared/models/SentPrompt";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";

export const PROMPT_CUSTOM_NOTIF_TOPIC_PREFIX = "custom_prompt_notif";

export default class PushNotificationService {
    static sharedInstance = new PushNotificationService();
    private messaging = admin.messaging();


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
     * @param {CactusMember} member
     * @param {String} prefix - the prefix to match the topics to unsubscribe. Uses a "startsWith" match.
     * @return {Promise<TopicUnsubscribeResult[]>}
     */
    async unsubscribeFromTopics(member: CactusMember, prefix: string): Promise<TopicUnsubscribeResult[]> {
        const results: TopicUnsubscribeResult[] = [];
        let topics = member.fcmTopicSubscriptions || [];
        topics = topics.filter(t => {
            t.startsWith(prefix)
        });
        const tokens = member.fcmTokens || [];
        if (topics.length === 0) {
            console.log(`member ${member.email} (${member.id}) has no subscribed topics. FCMTokens.length = ${tokens.length}. Not processing`);
            return results;
        }

        if (tokens.length === 0) {
            console.log(`member ${member.email} (${member.id}) has no FCK tokens. Topics.length = ${topics.length}. Not processing`);
            return results;
        }

        const tasks = topics.map(topic => new Promise<TopicUnsubscribeResult>(async resolve => {
                const result = new TopicUnsubscribeResult(topic);
                try {
                    const serverResponse = await this.messaging.unsubscribeFromTopic(tokens, topic);
                    console.log(`Unsubscribe server response for ${member.email} (${member.id})`, serverResponse);
                    result.firebaseResponse = serverResponse;
                } catch (error) {
                    console.error(`Failed to unsubscribe ${member.email} (${member.id}) from topic "${topic}"`);
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
     * @return {Promise<void>}
     */
    async subscribeToTopic(opts: { member: CactusMember, topic: string }): Promise<TopicSubscribeResult> {
        const {member, topic} = opts;
        const result = new TopicSubscribeResult(topic);

        const tokens = member.fcmTokens || [];
        result.tokens = tokens;
        if (tokens.length === 0) {
            console.log(`No tokens to subscribe for member ${member.email} (${member.id})`);
            return result;
        }
        try {
            console.log(`Subscribing member ${member.email} (${member.id} to topic ${topic}`);
            result.firebaseResponse = await this.messaging.subscribeToTopic(tokens, topic);
            return result;
        } catch (error) {
            console.error(`Failed to subscribe ${member.email} (${member.id}) to topic "${topic}"`, error);
            result.error = error;
            return result
        }
    }

    static getTopicForSendTimeUTC(sendTime: PromptSendTime): string {
        const {hour, minute} = sendTime;
        return `${PROMPT_CUSTOM_NOTIF_TOPIC_PREFIX}_${hour}_${minute}`;
    }

    async refreshPromptTopics(member: CactusMember): Promise<RefreshTopicsResult> {
        // const errorCode = "messaging/registration-token-not-registered";
        const refreshResult = new RefreshTopicsResult(member);
        try {
            const unsubscribeResult = await PushNotificationService.sharedInstance.unsubscribeFromTopics(member, PROMPT_CUSTOM_NOTIF_TOPIC_PREFIX);

            const topicsToRemove: string[] = [];
            unsubscribeResult.forEach(r => {
                if ((r.firebaseResponse?.successCount ?? 0) > 0) {
                    topicsToRemove.push(r.topic);
                    refreshResult.removedTopics.push(r.topic);
                }
            });
            console.log("unsubscribe result", JSON.stringify(unsubscribeResult, null, 2));
            const topic = PushNotificationService.getTopicForSendTimeUTC(member.promptSendTimeUTC || DEFAULT_PROMPT_SEND_TIME());
            const subscribeResult = await PushNotificationService.sharedInstance.subscribeToTopic({member, topic});

            const topics = (member.fcmTopicSubscriptions || []).filter(t => !topicsToRemove.includes(t));

            if ((subscribeResult.firebaseResponse?.successCount ?? 0) > 0) {
                topics.push(topic);
                refreshResult.addedTopics.push(topic);
            }

            const tokens = member.fcmTokens || [];
            const removedTokens: string[] = [];
            //handle expired/errored tokens
            subscribeResult.firebaseResponse?.errors.forEach(error => {
                const tokenIndex = error.index;
                const code = error.error.code;
                switch (code) {
                    case "messaging/registration-token-not-registered":
                        const removed = tokens.splice(tokenIndex, 1);
                        removedTokens.push(...removed);
                        break;
                    default:
                        break;
                }
            });
            refreshResult.removedTokens = removedTokens;
            member.fcmTokens = Array.from(new Set(tokens));
            member.fcmTopicSubscriptions = Array.from(new Set(topics));
            await AdminCactusMemberService.getSharedInstance().save(member);

            refreshResult.unsubscribeResults = unsubscribeResult;
            refreshResult.topicSubscribeResult = subscribeResult;

        } catch (error) {
            console.error("Failed to refresh member topics", error);
            refreshResult.error = error;
        }
        return refreshResult;
    }
}