import * as functions from "firebase-functions";
import {Collection} from "@shared/FirestoreBaseModels";
import {fromDocumentSnapshot} from "@shared/util/FirestoreUtil";
import ReflectionResponse, {
    getResponseMediumDisplayName,
    getResponseMediumSlackEmoji,
    isJournal
} from "@shared/models/ReflectionResponse";
import AdminSlackService, {
    AttachmentColor,
    SlackAttachment,
    SlackAttachmentField,
    SlackMessage
} from "@shared/services/AdminSlackService";
import AdminReflectionResponseService from "@shared/services/AdminReflectionResponseService";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import CactusMember from "@shared/models/CactusMember";
import AdminReflectionPromptService from "@shared/services/AdminReflectionPromptService";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import {buildPromptContentURL} from "@api/util/StringUtil";

/**
 * This function will reset the reflection reminder flag in Mailchimp and notify slack.
 * @type {CloudFunction<DocumentSnapshot>}
 */
export const onReflectionResponseCreated = functions.firestore
    .document(`${Collection.reflectionResponses}/{responseId}`)
    .onCreate(async (snapshot: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
            console.log("ReflectionResponse created");
            const slackService = AdminSlackService.getSharedInstance();
            const reflectionResponse = fromDocumentSnapshot(snapshot, ReflectionResponse);

            if (!reflectionResponse) {
                await slackService.sendEngineeringMessage(`:warning: Unable to get reflection response from reflectionResponse.onCreate trigger. \nData: \`\`\`${snapshot.data()}\`\`\``);
                return
            }

            let memberEmail = reflectionResponse.memberEmail;
            let member: CactusMember | undefined;
            if (reflectionResponse.cactusMemberId) {
                member = await AdminCactusMemberService.getSharedInstance().getById(reflectionResponse.cactusMemberId);
                if (member) {
                    memberEmail = member.email;
                }
            } else if (reflectionResponse.mailchimpUniqueEmailId) {
                member = await AdminCactusMemberService.getSharedInstance().getByMailchimpUniqueEmailId(reflectionResponse.mailchimpUniqueEmailId);
            }

            let prompt: ReflectionPrompt | undefined;
            if (reflectionResponse.promptId) {
                prompt = await AdminReflectionPromptService.getSharedInstance().get(reflectionResponse.promptId);
            }
            if (!prompt) {
                await slackService.sendEngineeringMessage(`Unable to load prompt for promptId ${reflectionResponse.promptId}`);
            }


            const attachments: SlackAttachment[] = [];
            let messageText = `${getResponseMediumSlackEmoji(reflectionResponse.responseMedium)} ${memberEmail} recorded a Reflection Response via *${getResponseMediumDisplayName(reflectionResponse.responseMedium)}*`;
            const fields: SlackAttachmentField[] = [];

            let resetReminderResult = "Not attempted";
            if (member && member.mailchimpListMember) {
                console.log(`Resetting the reminder for ${member.mailchimpListMember.email_address}`);
                const resetUserResponse = await AdminReflectionResponseService.resetUserReminder(member.mailchimpListMember.email_address);
                if (!resetUserResponse.success) {
                    console.log("reset user reminder failed", resetUserResponse);
                    resetReminderResult = `Failed - see details`;
                    attachments.push({
                        text: `Failed to reset reminder\n\`\`\`${JSON.stringify(resetReminderResult)}`,
                        color: "danger"
                    });
                    await slackService.sendActivityNotification(`:warning: Failed to reset user reminder for ${member.mailchimpListMember.email_address}\n\`\`\`${JSON.stringify(resetUserResponse)}\`\`\``)
                } else {
                    resetReminderResult = `${resetUserResponse.lastReplyString || "unknown"}`
                }
            } else {
                console.log("not resetting user reminder for email " + memberEmail)
            }


            if (member && memberEmail &&  isJournal(reflectionResponse.responseMedium)) {
                const setLastJournalDateResult = await AdminReflectionResponseService.setLastJournalDate(memberEmail);
                if (setLastJournalDateResult.error) {
                    console.error("Failed to set the last journal date", setLastJournalDateResult.error);
                }
            }


            fields.push(
                {
                    title: "Last Reply Updated",
                    value: resetReminderResult,
                    short: true,
                });


            if (prompt && prompt.question) {
                let contentLink = prompt.question;

                const link = buildPromptContentURL(prompt);

                if (prompt.contentPath) {
                    contentLink = `<${link}|${prompt.question}>`
                }

                fields.push(
                    {
                        title: "Prompt Question",
                        value: `${contentLink}`,
                        short: false,
                    }
                )
            } else {
                messageText += "\nNo prompt content link/question could be found."
            }

            attachments.unshift({
                fields,
                color: AttachmentColor.info
            });
            const slackMessage: SlackMessage = {attachments: attachments, text: messageText};
            await slackService.sendActivityNotification(slackMessage);


        }
    );
