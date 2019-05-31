import {getConfig} from "@api/config/configService";
import {IncomingWebhook,IncomingWebhookSendArguments} from "@slack/client";

const config = getConfig();
const appNotificationsWebhookUrl = config.slack.webhooks.cactus_activity;
const webhook = new IncomingWebhook(appNotificationsWebhookUrl);

export interface SlackMessage extends IncomingWebhookSendArguments {

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

