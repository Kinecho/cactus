import {getConfig} from "../config/configService";
import {IncomingWebhook} from "@slack/client";

const config = getConfig();
const appNotificationsWebhookUrl = config.slack.webhooks.cactus_activity;
const webhook = new IncomingWebhook(appNotificationsWebhookUrl);

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
 * @returns {Promise<SlackWebhookResponse>}
 */
export function sendActivityNotification(message:string):Promise<SlackMessageResult> {
    const isEnabled = enabled();
    console.log("slack enabled: ", isEnabled);
    if (!isEnabled) {
        return Promise.resolve({enabled: false, success: true});
    }

    const sendResult = webhook.send(message);

    return sendResult.then(result => {
        console.log("Slack Message sent: ", result.text);
        return {enabled: true, success: true, response: result.text};
    }).catch(error => {
        console.error("Error sending slack webhook notification", error);
        return {enabled: true, success: false, error: error};
    });

}

