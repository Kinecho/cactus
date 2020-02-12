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
import {buildPromptURL} from "@admin/util/StringUtil";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import SentPrompt, {PromptSendMedium} from "@shared/models/SentPrompt";
import Logger from "@shared/Logger";

const logger = new Logger("ReflectionResponseTriggers");

export const updateReflectionStatsTrigger = functions.firestore
    .document(`${Collection.reflectionResponses}/{responseId}`)
    .onWrite(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
        logger.log("updating member stats");
        const snapshot = change.after || change.before;
        if (!snapshot) {
            logger.warn("No snapshot was found in the change event");
            return
        }

        const data = snapshot.data();
        if (!data) {
            logger.error("No data could be retrieved from the snapshot", snapshot);
            return;
        }
        const memberId = data[ReflectionResponse.Field.cactusMemberId];
        if (!memberId) {
            logger.warn("No member ID was found in the document data", data);
            return;
        }
        const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
        if (!member) {
            logger.warn("Member details were not able to be loaded", data);
            return;
        }
        const timeZone = member.timeZone || undefined;

        const reflectionStats = await AdminReflectionResponseService.getSharedInstance().calculateStatsForMember({
            memberId,
            timeZone
        });
        if (reflectionStats) {
            await AdminCactusMemberService.getSharedInstance().setReflectionStats({memberId, stats: reflectionStats})
        }
    });

export const updateSentPromptOnReflectionWrite = functions.firestore
    .document(`${Collection.reflectionResponses}/{responseId}`)
    .onWrite(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
        logger.log("starting updateSentPromptOnReflectionWrite");
        try {
            const snapshot = change.after;
            if (!snapshot) {
                logger.warn("No snapshot was found in the change event");
                return
            }

            const reflectionResponse = fromDocumentSnapshot(snapshot, ReflectionResponse);
            if (!reflectionResponse) {
                logger.error(`Unable to de-serialize the reflection response for snapshot.id = ${snapshot.id}`);
                return;
            }

            logger.log(`Processing reflection response ${reflectionResponse.id}`);
            const promptId = reflectionResponse.promptId;
            const memberId = reflectionResponse.cactusMemberId;

            if (!promptId || !memberId) {
                logger.error("Failed to get a member id and/or a prompt ID off of ReflectionPrompt", snapshot.id);
                return;
            }

            const sentPrompt = await AdminSentPromptService.getSharedInstance().getSentPromptForCactusMemberId({
                cactusMemberId: memberId,
                promptId: promptId
            });
            if (!sentPrompt) {
                logger.info(`No sent prompt found for memberId = ${memberId} and promptId = ${promptId}. ReflectionResponseId = ${reflectionResponse.id}`);
                return;
            }

            if (sentPrompt.completed && !reflectionResponse.deleted) {
                logger.info("Sent prompt already completed");
                return;
            }

            let isComplete = !reflectionResponse.deleted;

            //get all responses to ensure it's completed
            //if any reflections are found that are _not_ deleted, then this sent prompt is still considered completed
            if (reflectionResponse.deleted) {
                const allResponses = await AdminReflectionResponseService.getSharedInstance().getMemberResponsesForPromptId({
                    memberId,
                    promptId
                });
                const anyCompleted = allResponses.find(r => !r.deleted);
                isComplete = !!anyCompleted
            }

            if (isComplete && sentPrompt.completed) {
                //there is nothing to do, no need to update the record.
                return;
            }

            //set completed and completedAt
            sentPrompt.completed = isComplete;

            sentPrompt.completedAt = isComplete ? new Date() : undefined;
            const saved = await AdminSentPromptService.getSharedInstance().save(sentPrompt);

            logger.log(`Successfully saved sentPrompt.id ${saved.id} for member ${memberId} and promptId ${promptId}`);
            return;
        } catch (error) {
            logger.error("Failed to process the ReflectionResponse.");
        }
    });

/**
 * This function will reset the reflection reminder flag in Mailchimp and notify slack.
 * @type {CloudFunction<DocumentSnapshot>}
 */
export const onReflectionResponseCreated = functions.firestore
    .document(`${Collection.reflectionResponses}/{responseId}`)
    .onCreate(async (snapshot: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
            logger.log("ReflectionResponse created");
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

            if (member && member.mailchimpListMember) {
                logger.log(`Resetting the reminder for ${member.mailchimpListMember.email_address}`);
                const resetUserResponse = await AdminReflectionResponseService.resetUserReminder(member.mailchimpListMember.email_address);
                if (!resetUserResponse.success) {
                    logger.log("reset user reminder failed", resetUserResponse);
                    attachments.push({
                        text: `Failed to reset reminder\n\`\`\`${JSON.stringify(resetUserResponse)}`,
                        color: "danger"
                    });
                    await slackService.sendActivityNotification(`:warning: Failed to reset user reminder for ${member.mailchimpListMember.email_address}\n\`\`\`${JSON.stringify(resetUserResponse)}\`\`\``)
                }
            } else {
                logger.log("not resetting user reminder for email " + memberEmail)
            }


            if (member && memberEmail && isJournal(reflectionResponse.responseMedium)) {
                const setLastJournalDateResult = await AdminReflectionResponseService.setLastJournalDate(memberEmail);
                if (setLastJournalDateResult.error) {
                    logger.error("Failed to set the last journal date", setLastJournalDateResult.error);
                }
            }


            const {sentPrompt, created: sentPromptCreated} = await createSentPromptIfNeeded({
                member,
                prompt,
                reflectionResponse
            });
            if (sentPrompt && sentPromptCreated) {
                logger.log("Created sent prompt", sentPrompt.toJSON());
                fields.push({
                    title: "SentPrompt created",
                    value: `${sentPrompt.id}`
                })
            }

            if (prompt && prompt.question) {
                let contentLink = prompt.question;

                const link = buildPromptURL(prompt);

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


async function createSentPromptIfNeeded(options: { member?: CactusMember, prompt?: ReflectionPrompt, reflectionResponse?: ReflectionResponse }): Promise<{ created: boolean, sentPrompt?: SentPrompt }> {
    const {member, prompt, reflectionResponse} = options;
    let sentPrompt = await getSentPrompt({member, prompt, reflectionResponse});
    if (sentPrompt) {
        return {created: false, sentPrompt};
    }

    if (member && member.id && prompt && prompt.id) {
        sentPrompt = new SentPrompt();
        sentPrompt.userId = member.userId;
        sentPrompt.memberEmail = member.email;
        sentPrompt.firstSentAt = new Date();
        sentPrompt.lastSentAt = new Date();
        sentPrompt.promptId = prompt.id;
        sentPrompt.cactusMemberId = member.id;
        sentPrompt.promptContentEntryId = prompt.promptContentEntryId;
        if (reflectionResponse && reflectionResponse.responseMedium && [ResponseMedium.PROMPT_WEB, ResponseMedium.PROMPT_ANDROID, ResponseMedium.PROMPT_IOS].includes(reflectionResponse.responseMedium)) {
            sentPrompt.sendHistory.push({
                sendDate: new Date(),
                medium: PromptSendMedium.PROMPT_CONTENT,
            })
        }
        sentPrompt.completed = true;
        sentPrompt.completedAt = new Date();

        const saved = await AdminSentPromptService.getSharedInstance().save(sentPrompt);
        return {sentPrompt: saved, created: true};
    }

    return {created: false};
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
        logger.warn(errorMessage);
        await AdminSlackService.getSharedInstance().sendAlertMessage(errorMessage)
    }
    return;
}