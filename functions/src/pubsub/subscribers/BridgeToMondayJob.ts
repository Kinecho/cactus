import {Message} from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import MailchimpService from "@shared/services/MailchimpService";
import AdminSlackService, {ChatMessage, SlackAttachment} from "@shared/services/AdminSlackService";


const mailchimpBridgeSegmentId = 58045;

export async function onPublish(message: Message, context: functions.EventContext) {


    const members = await MailchimpService.getSharedInstance().getAllAudienceSegmentMembers(mailchimpBridgeSegmentId);

    const slackService = AdminSlackService.getSharedInstance();
    const attachments: SlackAttachment[] = [];

    attachments.push({
        title: "Members to apply \`onboarding_suppressed\`",
        text: `Not Actually Processing yet:\nMembers:\n${members.map(member => member.email_address).join('\n')}`
    });

    const slackMessage: ChatMessage = {text: "Bridge to Monday Prune Job", attachments};


    await slackService.sendDataLogMessage(slackMessage);


}