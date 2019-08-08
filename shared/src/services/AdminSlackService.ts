import {CactusConfig} from "@shared/CactusConfig";
import {
    IncomingWebhook,
    IncomingWebhookSendArguments,
    MessageAttachment,
    WebClient,
    ChatPostMessageArguments
} from "@slack/client";
import axios from "axios";

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
    general = "general",
    activity = "activity",
    data_log = "data_log",
    email_sends = "email_sends",
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
        this.web = new WebClient(config.slack.app.oauth_access_token);
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
        console.log("slack enabled: ", isEnabled);
        if (!isEnabled) {
            return Promise.resolve({enabled: false, success: true});
        }

        try {
            const result = await this.cactusActivityWebhook.send(message);
            return {enabled: true, success: true, response: result.text};
        } catch (error) {
            return {enabled: true, success: false, error: error};
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
                            value: `${field}`,
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
            return `${channel}-test`;
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

        const response = await this.web.chat.postMessage(slackMessage);
        if (response.ok) {
            return;
        }

        if (response.error) {
            console.error("Failed to post slack message", response.error);
        }
    }

    async sendToResponseUrl(responseURL: string, message: IncomingWebhookSendArguments) {
        try {
            const response = await axios.post(responseURL, message);
            console.log("send to response url response success", response.data);
        } catch (error) {
            console.error("failed to send to response url", error.code, error.response)
        }
    }

    async sendMessage(channelName: ChannelName, message: string | ChatMessage) {
        try {


            let chatMessage: ChatMessage;
            const channel = this.getChannel(channelName);

            if (!channel) {
                throw new Error("Unable to find the chanel for the ChannelName: " + channelName);
            }

            if (typeof message === "string") {
                chatMessage = {
                    text: message,
                }
            } else {
                chatMessage = message;
            }

            const slackMessage: ChatPostMessageArguments = {
                ...chatMessage,
                channel: channel
            };


            const response = await this.web.chat.postMessage(slackMessage);
            if (response.ok) {
                return;
            }

            if (response.error) {
                console.error("Failed to post slack message", response.error);
            }

        } catch (error) {
            console.error(`Failed to send slack message to ${channelName}`, error);
        }
    }

    async sendEngineeringMessage(message: string | ChatMessage): Promise<void> {
        await this.sendMessage(ChannelName.engineering, message);
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


}
