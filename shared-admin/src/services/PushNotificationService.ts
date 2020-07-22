import CactusMember from "@shared/models/CactusMember";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import * as admin from "firebase-admin";
import * as Sentry from "@sentry/node";
import PromptContent from "@shared/models/PromptContent";
import { NewPromptNotificationPushResult } from "@admin/PushNotificationTypes";
import Logger from "@shared/Logger";
import { chunkArray, stringifyJSON } from "@shared/util/ObjectUtil";
import HoboCache from "@admin/HoboCache";
import { BaseMessage } from "firebase-admin/lib/messaging";
import { PushNotificationData } from "@shared/models/Notification";
import Message = admin.messaging.Message;
import BatchResponse = admin.messaging.BatchResponse;

const removeMarkdown = require("remove-markdown");

const logger = new Logger("PushNotificationService");
export default class PushNotificationService {
    static sharedInstance: PushNotificationService;

    static initialize(app: admin.app.App) {
        PushNotificationService.sharedInstance = new PushNotificationService(app);
    }

    private messaging: admin.messaging.Messaging;

    constructor(app: admin.app.App) {
        this.messaging = app.messaging();
    }

    /**
     * For a given PromptContent, build a push notification payload that can be sent to a device.
     * @param {object} params
     * @param {CactusMember} params.member - the Member this prompt will be sent to. If included, it may be used to personalize the mssage
     * @param {PromptContent} params.promptContent - the Prompt Content to notify the user about
     * @return {Messaging | undefined}
     */
    promptContentNotificationMessagePayload(params: { member: CactusMember, promptContent: PromptContent }): BaseMessage {
        const { member, promptContent } = params;
        const title = promptContent.subjectLine || "Today's Prompt";
        const body = promptContent.getDynamicPreviewText({ member }) ?? "It's time to reflect on today's Cactus prompt.";
        const entryId = promptContent.entryId;
        const promptId = promptContent.promptId;

        const data: admin.messaging.DataMessagePayload = {};
        if (entryId) {
            data.promptContentEntryId = entryId
        }
        if (promptId) {
            data.promptId = promptId;
        }

        return {
            notification: {
                title: title,
                body: removeMarkdown(body),
            },
            data,
            android: {
                notification: {
                    notificationCount: 1,
                }
            },
            apns: {
                payload: {
                    aps: {
                        badge: 1
                    }
                }
            }
        };
    }


    async sendPromptNotification(options: {
        member?: CactusMember,
        prompt?: ReflectionPrompt,
        promptContent?: PromptContent | null,
        dryRun?: boolean
    }): Promise<NewPromptNotificationPushResult> {
        let attempted = false;
        try {
            const { member, prompt, dryRun } = options;
            let { promptContent } = options;
            if (!member || !member.fcmTokens || !member.fcmTokens.length) {
                logger.log("Member doesn't have any device tokens. Returning");
                return { attempted: false, error: "Member doesn't have any device tokens" }
            }

            if (!prompt && !promptContent) {
                return { attempted: false, error: "No prompt or prompt content provided. Can not process message." };
            }

            const promptContentEntryId = prompt?.promptContentEntryId;
            if (!promptContent && promptContentEntryId) {
                promptContent = await HoboCache.shared.getPromptContent(promptContentEntryId);
            }

            if (!promptContent) {
                logger.warn("No prompt content found, can't send push");
                return { attempted: false, error: "Unable to find the prompt content. Can not process message" };
            }

            const payload = this.promptContentNotificationMessagePayload({ member, promptContent })
            const sendResult = await this.sendFCMToMember({ member, message: payload, dryRun })
            attempted = true;
            logger.log(`SendPushNotification for prompt ${ stringifyJSON(sendResult) }`);
            return {
                attempted,
                atLeastOneSuccess: sendResult.successCount > 0,
                result: {
                    numSuccess: sendResult.successCount,
                    numError: sendResult.failureCount,
                }
            };
        } catch (error) {
            logger.error("A runtime error occurred while trying to send a push notification", error);
            Sentry.captureException(error);
            return {
                attempted,
                error: "An unexpected error occurred while attempting to send push noticiations"
            };
        }
    }

    /**
     * Given a message, send to an array of tokens.
     * Messages will be sent in batches of 500 tokens (the Firebase max).
     * Batches of tokens will be sent in serial, after the previous batch finishes.
     *
     * @param {object} options
     * @param { admin.messaging.Message } options.message - the Push Notification message body to send
     * @param {string[]} options.tokens - the list of tokens to send pushes to. Messages will be sent in batches of 500
     * @param {boolean} [options.dryRun=false] - Optional. Set to true if this should be a dry run or not. Defaults false
     * @return {Promise<admin.messaging.BatchResponse>} - combined batch results
     * @throws Error
     */
    async sendMessageToTokens(options: { message: BaseMessage, tokens: string[], dryRun?: boolean }): Promise<BatchResponse> {
        const { tokens = [], message, dryRun } = options;
        if (tokens.length === 0) {
            return { successCount: 0, failureCount: 0, responses: [] }
        }

        const responses: BatchResponse[] = []
        const messages: Message[] = tokens.map(token => ({
            token,
            ...message
        }))

        const batches = chunkArray(messages, 500);
        for (const messageBatch of batches) {
            const batchResponse = await this.messaging.sendAll(messageBatch, dryRun);
            logger.log("Send Message Result", stringifyJSON(batchResponse));
            responses.push(batchResponse);
        }

        return this.combineBatchResponses(responses);
    }

    combineBatchResponses(results: BatchResponse[]): BatchResponse {
        const initial: BatchResponse = {
            failureCount: 0,
            successCount: 0,
            responses: []
        }
        return results.reduce((total, result) => {
            total.failureCount += result.failureCount;
            total.successCount += result.successCount;
            total.responses.push(...result.responses);
            return total;
        }, initial);

    }

    /**
     * Send a Firebase message to a member. Uses already formatted firebase.Message data.
     * @param {{message: BaseMessage, member?: CactusMember, dryRun?: boolean}} options
     * @return {Promise<admin.messaging.BatchResponse>}
     */
    async sendFCMToMember(options: { message: BaseMessage, member?: CactusMember, dryRun?: boolean }): Promise<BatchResponse> {
        const { message, member, dryRun } = options;
        const tokens = member?.fcmTokens ?? []

        return await this.sendMessageToTokens({ tokens, message, dryRun });
    }

    notificationPushDataToBaseMessage(pushData: PushNotificationData): BaseMessage {
        const { body, title, badgeCount, data } = pushData;
        return {
            notification: {
                title: removeMarkdown(title ?? ""),
                body: removeMarkdown(body ?? ""),
            },
            data,
            android: {
                notification: {
                    notificationCount: badgeCount,
                }
            },
            apns: {
                payload: {
                    aps: {
                        badge: badgeCount
                    }
                }
            }
        }
    }

    /**
     * Send an arbitrary push notification to a member. Uses Cactus Push Data as the payload.
     * This method will transform data into correct firebase format.
     *
     * As of 2020-06-22, This is the preferred way to send push notifications to members.
     * @param {object} params
     * @param {PushNotificationData} params.data
     * @param {CactusMember} params.member
     * @param {boolean} params.dryRun
     */
    async sendPushDataToMember(params: { data: PushNotificationData, member: CactusMember, dryRun?: boolean }): Promise<BatchResponse> {
        const { data, member, dryRun } = params;
        const tokens = member.fcmTokens ?? [];

        const message: BaseMessage = this.notificationPushDataToBaseMessage(data);
        try {
            return await this.sendMessageToTokens({ tokens, message, dryRun });
        } catch (error) {
            logger.error("A runtime error occurred while trying to send a push notification", error);
            Sentry.captureException(error);
            return {
                failureCount: tokens.length,
                successCount: 0,
                responses: [],
            }
        }


    }
}