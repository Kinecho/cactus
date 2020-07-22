import { CactusConfig } from "@admin/CactusConfig";
import {
    ChatPostMessageArguments,
    IncomingWebhook,
    IncomingWebhookSendArguments,
    MessageAttachment,
    WebClient
} from "@slack/client";
import axios from "axios";
import Logger from "@shared/Logger";

const logger = new Logger("AdminSlackService");

/**
 * @typedef {{
 *   enabled: Boolean,
 *   success: Boolean,
 *   [error]: *,
 *   [response]: *
 * }} SlackWebhookResponse
 */


export enum AttachmentColor {
    info = "#83ecf9",
    error = "#7A3814",
    success = "#0d7a03",
    warning = "#FFC947",
}

export type SlackMessage = IncomingWebhookSendArguments
export type SlackAttachment = MessageAttachment

export interface ChatMessage extends Partial<ChatPostMessageArguments> {
    text: string,
}

export type SlackAttachmentField = {
    title: string;
    value: string;
    short?: boolean;
}

export interface SlackMessageResult {
    enabled: boolean,
    success: boolean,
    response?: string,
    error?: any,
}

export enum ChannelName {
    engineering = "engineering",
    db_alerts = "db-alerts",
    general = "general",
    activity = "activity",
    data_log = "data_log",
    email_sends = "email_sends",
    ci = "ci",
    alerts = "cactus-alerts",
    content = "content",
    customer_support = "customer-support",
    signups = "signups",
    deletions = "deletions",
    cha_ching = "cha-ching",
    subscription_status = "subscription-status",
    cancellation_processing = "cancellation-processing",
    customer_data_export = "customer-data-export",
    promo_activity = "promo-activity",
}

export enum SlackResponseType {
    in_channel = "in_channel",
    ephemeral = "ephermeral",
}

export interface SlashCommandResponse extends Partial<ChatMessage> {
    response_type?: SlackResponseType,
    fileData?: string,
}


export default class AdminSlackService {
    protected static sharedInstance: AdminSlackService;
    protected config: CactusConfig;

    public static ChannelName = ChannelName;
    public static SlackMessageResult: SlackMessageResult;

    appNotificationsWebhookUrl: string;
    cactusActivityWebhook: IncomingWebhook;
    web: WebClient;


    static getSharedInstance(): AdminSlackService {
        if (!AdminSlackService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminSlackService before using it");
        }
        return AdminSlackService.sharedInstance;
    }

    static initialize(config: CactusConfig) {

        AdminSlackService.sharedInstance = new AdminSlackService(config);
    }

    constructor(config: CactusConfig) {
        this.config = config;

        this.appNotificationsWebhookUrl = config.slack.webhooks.cactus_activity;
        this.cactusActivityWebhook = new IncomingWebhook(this.appNotificationsWebhookUrl);
        this.web = new WebClient(config.slack.app.bot_user_access_token);
    }


    enabled() {
        return true;
    }


    /**
     *
     * @param {*} message - the message to pass to the webhook
     * @returns {Promise<SlackMessageResult>}
     */
    async sendActivityNotification(message: string | IncomingWebhookSendArguments): Promise<SlackMessageResult> {
        const isEnabled = this.enabled();
        logger.log("slack enabled: ", isEnabled);
        if (!isEnabled) {
            return Promise.resolve({ enabled: false, success: true });
        }

        try {
            const result = await this.cactusActivityWebhook.send(message);
            return { enabled: true, success: true, response: result.text };
        } catch (error) {
            return { enabled: true, success: false, error: error };
        }
    }


    static getAttachmentForObject(data: any): SlackAttachment {
        const fields: SlackAttachmentField[] = [];
        Object.keys(data)
        .filter(key => {
            return data[key] || "";
        })
        .forEach((key) => {
            function processField(title: string, field: any) {
                if (typeof field === "object" && !Array.isArray(field)) {
                    Object.entries(field).forEach(([objectKey, value]) => {
                        processField(objectKey, value);
                    })
                } else if (Array.isArray(field)) {
                    fields.push({
                        title: title,
                        value: JSON.stringify(field),
                        short: true,
                    })
                } else {
                    fields.push({
                        title: title,
                        value: `${ field }`,
                        short: true,
                    })
                }
            }

            const merge = data[key] || "";
            processField(key, merge);
        });

        const attachment: SlackAttachment = {
            fields: fields
        };

        return attachment;
    }

    getChannel(name: ChannelName): string | undefined {
        const channelToUse = this.config.slack.channels[name];
        if (channelToUse) {
            return channelToUse;
        }

        const channel = name.replace("_", "-");
        if (this.config.web.domain !== "cactus.app") {
            return `${ channel }-test`;
        } else {
            return channel;
        }
    }

    async sendArbitraryMessage(channelId: string, message: string | ChatMessage) {
        let chatMessage: ChatMessage;

        if (typeof message === "string") {
            chatMessage = {
                text: message,
            }
        } else {
            chatMessage = message;
        }

        const slackMessage: ChatPostMessageArguments = {
            ...chatMessage,
            channel: channelId
        };

        try {
            const response = await this.web.chat.postMessage(slackMessage);
            if (response.ok) {
                return;
            }
        } catch (error) {
            logger.error(`Failed to send message to channel ${ channelId }`, error);
            if (error.data.error === "not_in_channel") {
                console.log("Attempting to join channel and retry the message");
                const joined = await this.joinChannel(channelId);
                if (joined) {
                    try {
                        await this.web.chat.postMessage(slackMessage);
                        return;
                    } catch (error) {
                        logger.error("Still can't send message. not trying again");
                        return;
                    }
                } else {
                    logger.error(`was unable to join channel ${ channelId }, not retrying`, JSON.stringify(error, null, 2));
                }
            } else {
                logger.error(`Failed to send slack message to ${ channelId }`, error);
            }
        }
    }


    async sendToResponseUrl(responseURL: string, message: SlashCommandResponse) {
        try {
            const response = await axios.post(responseURL, message);
            logger.log("send to response url response success", response.data);
        } catch (error) {
            logger.error("failed to send to response url", error.code, error.response)
        }
    }


    async sendMessage(channelName: ChannelName, message: string | ChatMessage) {
        const channel = this.getChannel(channelName);
        if (!channel) {
            logger.error("Unable to find the chanel for the ChannelName: " + channelName);
            return;
        }
        await this.sendArbitraryMessage(channel, message);
        // let chatMessage: ChatMessage;
        //
        //
        // if (typeof message === "string") {
        //     chatMessage = {
        //         text: message,
        //     }
        // } else {
        //     chatMessage = message;
        // }
        //
        // const slackMessage: ChatPostMessageArguments = {
        //     ...chatMessage,
        //     channel: channel
        // };
        //
        // try {
        //     const response = await this.web.chat.postMessage(slackMessage);
        //     if (response.ok) {
        //         return;
        //     }
        //     if (response.error) {
        //         logger.error("Failed to post slack message", response.error);
        //     }
        //
        // } catch (error) {
        //     if (error.data.error === "not_in_channel") {
        //         console.log("Attempting to join channel and retry the message");
        //         const joined = await this.joinChannel(channel);
        //         if (joined) {
        //             try {
        //                 await this.web.chat.postMessage(slackMessage);
        //                 return;
        //             } catch (error) {
        //                 logger.error("Still can't send message. not trying again");
        //                 return;
        //             }
        //         } else {
        //             logger.error(`was unable to join channel ${channelName}, not retrying`, JSON.stringify(error, null, 2));
        //         }
        //     } else {
        //         logger.error(`Failed to send slack message to ${channelName}`, error);
        //     }
        //
        // }
    }

    async joinChannel(channel: string): Promise<boolean> {
        try {
            await this.web.channels.join({ name: channel });
            return true;
        } catch (error) {
            logger.error("Failed to join channel", error);
            return false;
        }

    }

    async sendEngineeringMessage(message: string | ChatMessage): Promise<void> {
        await this.sendMessage(ChannelName.engineering, message);
    }

    async sendDbAlertsMessage(message: string | ChatMessage): Promise<void> {
        await this.sendMessage(ChannelName.db_alerts, message);
    }

    async sendChaChingMessage(message: string | ChatMessage): Promise<void> {
        await this.sendMessage(ChannelName.cha_ching, message);
    }

    async sendSubscriptionStatusMessage(message: string | ChatMessage): Promise<void> {
        await this.sendMessage(ChannelName.subscription_status, message);
    }


    async sendDeletionMessage(message: string | ChatMessage): Promise<void> {
        await this.sendMessage(ChannelName.deletions, message);
    }

    async sendCustomerSupportMessage(message: string | ChatMessage): Promise<void> {
        await this.sendMessage(ChannelName.customer_support, message);
    }

    async sendDataLogMessage(message: string | ChatMessage): Promise<void> {
        await this.sendMessage(ChannelName.data_log, message);
    }

    async sendGeneralMessage(message: string | ChatMessage): Promise<void> {
        await this.sendMessage(ChannelName.general, message);
    }


    async sendActivityMessage(message: string | ChatMessage): Promise<void> {
        await this.sendMessage(ChannelName.activity, message);
    }

    async sendSignupsMessage(message: string | ChatMessage): Promise<void> {
        await this.sendMessage(ChannelName.signups, message);
    }

    async sendCIMessage(message: string | ChatMessage): Promise<void> {
        await this.sendMessage(ChannelName.ci, message);
    }

    async sendAlertMessage(message: string | ChatMessage): Promise<void> {
        await this.sendMessage(ChannelName.alerts, message)
    }

    static getProviderEmoji(provider?: string): string | undefined {
        switch (provider) {
            case "apple.com":
                return ":ios:";
            case "password":
                return ":link:";
            case "twitter.com":
                return ":twitter:";
            case "facebook.com":
                return ":facebook:";
            case "google.com":
                return ":google:";
            default:
                return undefined;
        }
    }

    async uploadTextSnippet(options: {
        data: string,
        channel?: ChannelName | string,
        channels?: string[],
        filename: string,
        fileType?: string | undefined
        title?: string
        message?: string,
        useChannelId?: boolean
    } & ({ channels: string[] } | { channel: ChannelName | string })) {
        const { data, channel, useChannelId, filename, fileType, title, message, channels } = options;
        const channelParam: string[] = channels ?? [];

        let channelId = undefined;
        if (channel) {
            channelId = useChannelId ? channel : this.getChannel(channel as ChannelName);
        }

        if (channelId) {
            channelParam.push(channelId);
        }
        logger.info("channels to upload to", channelParam.filter(Boolean).join(","))
        try {
            const result = await this.web.files.upload({
                channels: channelParam.filter(Boolean).join(","),
                content: data,
                filetype: fileType,
                title,
                filename: filename,
                initial_comment: message,
            })
            logger.info("Upload file result", JSON.stringify(result, null, 2));

            return result;
        } catch (error) {
            logger.error("failed to upload text snippet", error);
            logger.error("error data", JSON.stringify(error.data, null, 2));
            return;
        }

    }
}

