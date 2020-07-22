import { ReflectionActivityParams } from "@admin/managers/SlackManagerTypes";
import AdminSlackService, {
    AttachmentColor,
    SlackAttachment,
    SlackAttachmentField,
    SlackMessage
} from "@admin/services/AdminSlackService";
import { getResponseMediumDisplayName, getResponseMediumSlackEmoji } from "@shared/util/ReflectionResponseUtil";
import Logger from "@shared/Logger"

const logger = new Logger("SlackManager");


export default class SlackManager {
    static shared = new SlackManager()

    async notifyMemberActivity(params: ReflectionActivityParams): Promise<void> {
        const { member, reflectionResponse, sentPrompt, sentPromptCreated } = params;

        const attachments: SlackAttachment[] = [];
        let messageText = `${ getResponseMediumSlackEmoji(reflectionResponse?.responseMedium) } ${ member?.email ?? "A member without email" } recorded a Reflection Response via *${ getResponseMediumDisplayName(reflectionResponse?.responseMedium) }*`;
        const fields: SlackAttachmentField[] = [];

        if (sentPrompt && sentPromptCreated) {
            logger.log("Created sent prompt", sentPrompt.toJSON());
            fields.push({
                title: "SentPrompt created",
                value: `${ sentPrompt.id }`
            })
        }

        if (member?.subscription?.tier) {
            const isTrialing = member?.isOptInTrialing || member?.isOptOutTrialing;
            const trialDaysLeft = member?.daysLeftInTrial;
            let daysLeftText = '';

            if (isTrialing && trialDaysLeft > 0) {
                daysLeftText = ' (' + trialDaysLeft + ' days left)';
            } else if (isTrialing && trialDaysLeft === 0) {
                daysLeftText = ' (Ends Today)';
            }

            fields.push({
                title: "Subscription",
                value: `${ member.tierDisplayName }${ daysLeftText }`
            })
        }

        if (member?.stats?.reflections?.totalCount) {
            let reflectionText = 'reflection';

            if (member.stats.reflections.totalCount > 1) {
                reflectionText = reflectionText + 's';
            }

            let streakText = ', ';
            if (member.stats.reflections.currentStreakDays > 1) {
                streakText = streakText + member.stats.reflections.currentStreakDays + ' day streak'
            } else if (member.stats.reflections.currentStreakWeeks > 1) {
                streakText = streakText + member.stats.reflections.currentStreakWeeks + ' week streak'
            } else if (member.stats.reflections.currentStreakMonths > 1) {
                streakText = streakText + member.stats.reflections.currentStreakMonths + ' month streak'
            } else {
                streakText = streakText + '1 day streak';
            }

            fields.push({
                title: "Engagement",
                value: `${ member.stats.reflections.totalCount } ${ reflectionText }${ streakText }`
            })
        }

        if (reflectionResponse?.promptQuestion) {
            fields.push({
                title: "Prompt Question",
                value: `${ reflectionResponse.promptQuestion }`,
                short: false,
            })
        } else {
            messageText += "\nNo prompt content link/question could be found."
        }

        attachments.unshift({
            fields,
            color: AttachmentColor.info
        });
        const slackMessage: SlackMessage = { attachments: attachments, text: messageText };
        await AdminSlackService.getSharedInstance().sendActivityNotification(slackMessage);
    }
}