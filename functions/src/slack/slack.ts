import {getConfig} from "@api/config/configService";
import {IncomingWebhook,IncomingWebhookSendArguments, MessageAttachment} from "@slack/client";

const config = getConfig();
const appNotificationsWebhookUrl = config.slack.webhooks.cactus_activity;
const webhook = new IncomingWebhook(appNotificationsWebhookUrl);
export enum AttachmentColor {
    info = "#83ecf9",
    error = "#7A3814",
    success = "#0d7a03",
    warning = "#FFC947",
}

export type SlackMessage = IncomingWebhookSendArguments
export type SlackAttachment = MessageAttachment
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

/**
 * @typedef {{
 *   enabled: Boolean,
 *   success: Boolean,
 *   [error]: *,
 *   [response]: *
 * }} SlackWebhookResponse
 */

export function enabled() {
    return true;
}


/**
 *
 * @param {*} message - the message to pass to the webhook
 * @returns {Promise<SlackMessageResult>}
 */
export async function sendActivityNotification(message:string|IncomingWebhookSendArguments):Promise<SlackMessageResult> {
    const isEnabled = enabled();
    console.log("slack enabled: ", isEnabled);
    if (!isEnabled) {
        return Promise.resolve({enabled: false, success: true});
    }

    try {
        const result = await webhook.send(message);
        return {enabled: true, success: true, response: result.text};
    } catch (error) {
        return {enabled: true, success: false, error: error};
    }
}

export function getAttachmentForObject(data:any):SlackAttachment{
    const fields: SlackAttachmentField[] = [];
    Object.keys(data)
        .filter(key => {
            return data[key] || "";
        })
        .forEach((key) => {
            function processField(title: string, field:any){
                if (typeof field === "object" && !Array.isArray(field)) {
                    Object.entries(field).forEach(([objectKey, value]) => {
                       processField(objectKey, value);
                    })
                }
                else if (Array.isArray(field)){
                    fields.push({
                        title: title,
                        value: JSON.stringify(field),
                        short: true,
                    })
                }
                else {
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

    const attachment:SlackAttachment = {
        fields: fields
    };

    return attachment;
}