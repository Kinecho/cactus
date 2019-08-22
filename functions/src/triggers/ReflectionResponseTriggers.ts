import * as functions from "firebase-functions";
import {Collection} from "@shared/FirestoreBaseModels";
import {fromDocumentSnapshot} from "@shared/util/FirestoreUtil";
import ReflectionResponse, {
    getResponseMediumDisplayName,
    getResponseMediumSlackEmoji,
    isJournal,
    ResponseMedium
} from "@shared/models/ReflectionResponse";
import AdminSlackService, {
    AttachmentColor,
    SlackAttachment,
    SlackAttachmentField,
    SlackMessage
} from "@admin/services/AdminSlackService";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import CactusMember from "@shared/models/CactusMember";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import {buildPromptContentURL} from "@api/util/StringUtil";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import SentPrompt, {PromptSendMedium} from "@shared/models/SentPrompt";

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
                await slackService.sendEngineeringMessage(`\`ReflectionPromptCreatedTrigger\`: No \`ReflectionPrompt\` found in the data base for  for promptId \`${reflectionResponse.promptId}\`. Member Email \`${memberEmail}\``);
            }


            const attachments: SlackAttachment[] = [];
            let messageText = `${getResponseMediumSlackEmoji(reflectionResponse.responseMedium)} ${memberEmail || "An anonymous user"} recorded a Reflection Response via *${getResponseMediumDisplayName(reflectionResponse.responseMedium)}*`;
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


            if (member && memberEmail && isJournal(reflectionResponse.responseMedium)) {
                const setLastJournalDateResult = await AdminReflectionResponseService.setLastJournalDate(memberEmail);
                if (setLastJournalDateResult.error) {
                    console.error("Failed to set the last journal date", setLastJournalDateResult.error);
                }
            }

            const sentPrompt = await createSentPromptIfNeeded({member, prompt, reflectionResponse});
            if (sentPrompt) {
                console.log("Created sent prompt", sentPrompt.toJSON());
                fields.push({
                    title: "SentPrompt created",
                    value: `${sentPrompt.id}`
                })
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


async function createSentPromptIfNeeded(options: { member?: CactusMember, prompt?: ReflectionPrompt, reflectionResponse?: ReflectionResponse }): Promise<SentPrompt | undefined> {
    const {member, prompt, reflectionResponse} = options;
    let sentPrompt = await getSentPrompt({member, prompt, reflectionResponse});
    if (sentPrompt) {
        return sentPrompt;
    }

    if (member && member.id && prompt && prompt.id) {
        sentPrompt = new SentPrompt();
        sentPrompt.userId = member.userId;
        sentPrompt.memberEmail = member.email;
        sentPrompt.firstSentAt = new Date();
        sentPrompt.lastSentAt = new Date();
        sentPrompt.promptId = prompt.id;
        sentPrompt.promptContentEntryId = prompt.promptContentEntryId;
        if (reflectionResponse && reflectionResponse.responseMedium && [ResponseMedium.PROMPT_WEB, ResponseMedium.PROMPT_ANDROID, ResponseMedium.PROMPT_IOS].includes(reflectionResponse.responseMedium)) {
            sentPrompt.sendHistory.push({
                sendDate: new Date(),
                medium: PromptSendMedium.PROMPT_CONTENT,
            })
        }

        return await AdminSentPromptService.getSharedInstance().save(sentPrompt);
    }

    return;
}

async function getSentPrompt(options: { member?: CactusMember, prompt?: ReflectionPrompt, reflectionResponse?: ReflectionResponse }): Promise<SentPrompt | undefined> {
    const {member, prompt, reflectionResponse} = options;
    if (member && member.id && prompt && prompt.id) {
        return AdminSentPromptService.getSharedInstance().getSentPromptForCactusMemberId({
            cactusMemberId: member.id,
            promptId: prompt.id
        })
    } else if (reflectionResponse && !reflectionResponse.anonymous) {
        const errorMessage = `Non-Anonymous reflection response Unable to search for sent prompt because no member and/or promptId was found\n Member: ${member && member.email} | Prompt ${prompt && prompt.id}`
        console.warn(errorMessage);
        await AdminSlackService.getSharedInstance().sendAlertMessage(errorMessage)
    }
    return;
}