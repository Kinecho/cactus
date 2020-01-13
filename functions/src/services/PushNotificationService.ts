import CactusMember from "@shared/models/CactusMember";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import * as admin from "firebase-admin";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import * as Sentry from "@sentry/node";
import PromptContent from "@shared/models/PromptContent";
import {NewPromptNotificationResult, SendPushResult} from "@admin/PushNotificationTypes";
import SentPrompt, {PromptSendMedium} from "@shared/models/SentPrompt";
import Logger from "@shared/Logger";

const logger = new Logger("PushNotificationService");
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
                logger.log("Member doesn't have any device tokens. Returning");
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
                logger.warn("No prompt content found, can't send push");
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

            const tokens = member.fcmTokens;
            attempted = true;
            const tasks: Promise<SendPushResult>[] = tokens.map(token => this.sendPush({token, payload, member}));

            const results = await Promise.all(tasks);
            logger.log(`SendPushNotification for prompt Got ${results.length} results`);
            const numSuccess = results.filter(r => r.success).length;
            return {
                attempted,
                atLeastOneSuccess: numSuccess > 0,
                result: {
                    numSuccess,
                    numError: results.filter(r => r.error).length,
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

    async sendPush(options: { token: string, payload: admin.messaging.MessagingPayload, member?: CactusMember }): Promise<SendPushResult> {
        const {token, payload, member} = options;
        try {
            const result = await this.messaging.sendToDevice(token, payload);
            logger.log("Send Message Result", result);
            return {token, success: true};

        } catch (error) {
            logger.error(`Failed to send the push notification to ${member?.id} ${member?.email}:`, error.code ? error.code : error);
            Sentry.captureException(error);
            return {
                success: false,
                token,
                error: `Failed to send the push notification to ${member?.id} ${member?.email}: ${error.code ? error.code : error} `
            }
        }
    }
}