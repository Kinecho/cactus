import * as functions from "firebase-functions";
import AdminSentPromptService from "@shared/services/AdminSentPromptService";
import {CampaignRecipientJobPayload, PubSubTopic} from "@shared/types/PubSubTypes";
import AdminSlackService, {AttachmentColor, SlackAttachment} from "@shared/services/AdminSlackService";
import {Message} from "firebase-functions/lib/providers/pubsub";
import {PubSub} from "@google-cloud/pubsub";

export async function submitJob(payload: CampaignRecipientJobPayload): Promise<string> {
    const pubsub = new PubSub();
    return pubsub.topic(PubSubTopic.process_mailchimp_email_recipients).publishJSON(payload);
}

export async function onPublish(message: Message, context: functions.EventContext) {
    console.log("Starting Mailchimp Campaign Recipient Processing Job. eventId =", context.eventId);
    if (!message || !message.json) {

        console.error("PubSub message was not JSON");
    }
    const sentPromptService = AdminSentPromptService.getSharedInstance();
    const payload: CampaignRecipientJobPayload = message.json;
    try {
        const results = await sentPromptService.processSentMailchimpCampaign({
            campaignId: payload.campaignId,
            promptId: payload.reflectionPromptId
        });

        console.log(`Got ${results.length} results from the mailchimp campaign processor`);

        const errors: { campaignId?: string, message?: string, error?: any }[] = [];
        const successes: any = [];
        const warnings: { message?: string, campaignId?: string }[] = [];
        results.forEach(result => {
            if (result.error) {
                console.log(result.error.message, result.error.error);
                errors.push(result.error)
            } else if (result.warning) {
                warnings.push(result.warning);
            } else {
                successes.push({
                    email: result.recipient ? result.recipient.email_address : "",
                    cactusMemberId: result.sentPrompt ? result.sentPrompt.cactusMemberId : "",
                    sentPromptId: result.sentPrompt ? result.sentPrompt.id : "",
                    userId: result.sentPrompt ? result.sentPrompt.userId : "",
                });
            }
        });

        if (errors.length > 0 || warnings.length > 0) {
            const attachments: SlackAttachment[] = [
                {
                    text: `PubSub Payload: \n\`\`\`${JSON.stringify(payload, null, 2)}\`\`\``,
                    color: AttachmentColor.info,
                },
            ];

            if (successes.length > 0) {
                attachments.push({
                    text: `Successful Recipients (${successes.length})\n${JSON.stringify(successes, null, 2)}`,
                    color: "good",
                })
            }

            if (warnings.length > 0) {
                attachments.push({
                    text: `Warnings (${warnings.length}) \n\`\`\`${JSON.stringify(warnings, null, 2)}\`\`\``,
                    color: "warning"
                })
            }

            if (errors.length > 0) {
                attachments.push({
                    text: `Failed Items (${errors.length}) \n\`\`\`${JSON.stringify(errors, null, 2)}\`\`\``,
                    color: "danger"
                })
            }

            await AdminSlackService.getSharedInstance().sendDataLogMessage({
                text: `:warning: MailchimpCampaignRecipientJob finished with ${successes.length} successes, ${errors.length} errors and ${warnings.length} warnings`,
                attachments: attachments,
            })
        } else {
            await AdminSlackService.getSharedInstance().sendDataLogMessage({
                text: `:white_check_mark: MailchimpCampaignRecipientJob finished with ${successes.length} successes, ${errors.length} errors and ${warnings.length} warnings. CampaignID ${payload.campaignId} | PromptID ${payload.reflectionPromptId || "not set"}`,
            })
        }


    } catch (error) {
        console.error("Failed to process payload", payload, error);
        const msg = {
            text: `:warning: MailchimpCampaignRecipientJob failed`,
            attachments: [
                {
                    text: `Payload: \n\`\`\`${JSON.stringify(payload, null, 2)}}\`\`\``,
                    color: AttachmentColor.info,
                },
                {
                    text: `An unexpected error occurred. Error\n\`\`\`${error}\`\`\``,
                    color: "danger"
                }

            ]
        }
        await AdminSlackService.getSharedInstance().sendEngineeringMessage(msg);
        await AdminSlackService.getSharedInstance().sendDataLogMessage(msg);
    }
}