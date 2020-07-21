import * as functions from "firebase-functions";
import { Collection } from "@shared/FirestoreBaseModels";
import { fromDocumentSnapshot } from "@shared/util/FirestoreUtil";
import ReflectionResponse from "@shared/models/ReflectionResponse";
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
import { buildPromptURL } from "@admin/util/StringUtil";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import SentPrompt, { PromptSendMedium } from "@shared/models/SentPrompt";
import Logger from "@shared/Logger";
import AdminRevenueCatService from "@admin/services/AdminRevenueCatService";
import HoboCache from "@admin/HoboCache";
import { isNull } from "@shared/util/ObjectUtil";
import SlackManager from "@admin/managers/SlackManager";
import {
    getAppTypeFromResponseMedium,
    getResponseMediumDisplayName,
    getResponseMediumSlackEmoji,
    isJournal, ResponseMedium
} from "@shared/util/ReflectionResponseUtil";

const logger = new Logger("ReflectionResponseTriggers");

export const updateReflectionStatsTrigger = functions.firestore
.document(`${ Collection.reflectionResponses }/{responseId}`)
.onWrite(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
    logger.log("updating member stats job started");
    const snapshot = change.after || change.before;
    if (!snapshot) {
        logger.warn("No snapshot was found in the change event");
        return
    }

    const textBefore = change.before?.get("content.text");
    const textAfter = change.after?.get("content.text");

    logger.info("textBefore", textBefore);
    logger.info("textAfter", textAfter);
    const mightNeedInsights = change.after?.get(ReflectionResponse.Field.mightNeedInsightsUpdate) as boolean | undefined ?? false;

    logger.info("Might need insights", mightNeedInsights);

    const hasTextChanges = textBefore?.toLowerCase().trim() !== textAfter?.toLowerCase().trim()

    logger.info("Has text changes", hasTextChanges);
    const reflectionResponse = fromDocumentSnapshot(change.after, ReflectionResponse);
    const hasAllInsights = !isNull(reflectionResponse?.sentiment) && !isNull(reflectionResponse?.toneAnalysis) && !isNull(reflectionResponse?.insights?.insightWords);


    // If the reflection hasn't changed text and already has all of the insight values, set that the doc doesn't need changes.
    if (change.after.exists && !hasTextChanges && mightNeedInsights && hasAllInsights) {
        logger.info("Change after exists, no text changes, but it might need changes, but all insights are presnt. Setting to doesn't need changes")
        await change.after.ref.update({ [ReflectionResponse.Field.mightNeedInsightsUpdate]: false });
        return;
    }

    // In any case, if there are no text changes and we don't think there may need to be insight updates, exit.
    if (!hasTextChanges && !mightNeedInsights) {
        logger.info("[update reflection stats trigger] Text hasn't changed, not processing");
        return;
    }

    const data = snapshot.data();
    if (!data) {
        logger.error("No data could be retrieved from the snapshot", snapshot);
        return;
    }
    const memberId = snapshot.get(ReflectionResponse.Field.cactusMemberId) as string | undefined;
    if (!memberId) {
        logger.warn("No member ID was found in the document data", data);
        return;
    }


    await AdminReflectionResponseService.getSharedInstance().updateTextAnalysis(reflectionResponse);

    await AdminCactusMemberService.getSharedInstance().updateStatsOnReflectionResponse(memberId);

    // Update member last seen and log some other analytics stuff
    const { member } = await HoboCache.shared.getMemberById(memberId);
    const responseMedium: ResponseMedium | undefined | null = change.after.get(ReflectionResponse.Field.responseMedium);

    const appType = getAppTypeFromResponseMedium(responseMedium);
    await AdminRevenueCatService.shared.updateLastSeen({ memberId, appType: appType, updateLastSeen: true });
    await AdminRevenueCatService.shared.updateSubscriberAttributes(member ?? undefined);
});

export const updateSentPromptOnReflectionWrite = functions.firestore
.document(`${ Collection.reflectionResponses }/{responseId}`)
.onUpdate(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
    logger.log("starting updateSentPromptOnReflectionWrite");
    try {
        const snapshot = change.after;
        if (!snapshot) {
            logger.warn("No snapshot was found in the change event");
            return
        }

        const sharingChanged = change.before.get(ReflectionResponse.Field.shared) !== change.after.get(ReflectionResponse.Field.shared)

        const reflectionResponse = fromDocumentSnapshot(snapshot, ReflectionResponse);
        if (!reflectionResponse) {
            logger.error(`Unable to de-serialize the reflection response for snapshot.id = ${ snapshot.id }`);
            return;
        }

        logger.log(`Processing reflection response ${ reflectionResponse.id }`);
        const promptId = reflectionResponse.promptId;
        const memberId = reflectionResponse.cactusMemberId;

        if (!promptId || !memberId) {
            logger.error("Failed to get a member id and/or a prompt ID off of ReflectionPrompt", snapshot.id);
            return;
        }

        if (sharingChanged) {
            const prompt = await AdminReflectionPromptService.getSharedInstance().get(promptId);
            if (prompt && prompt.memberId === memberId) {
                prompt.shared = reflectionResponse.shared;
                await AdminReflectionPromptService.getSharedInstance().setShared(promptId, reflectionResponse.shared);
            }
        }

        const sentPrompt = await AdminSentPromptService.getSharedInstance().getSentPromptForCactusMemberId({
            cactusMemberId: memberId,
            promptId: promptId
        });
        if (!sentPrompt) {
            logger.info(`No sent prompt found for memberId = ${ memberId } and promptId = ${ promptId }. ReflectionResponseId = ${ reflectionResponse.id }`);
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

        logger.log(`Successfully saved sentPrompt.id ${ saved.id } for member ${ memberId } and promptId ${ promptId }`);
        return;
    } catch (error) {
        logger.error("Failed to process the ReflectionResponse.");
    }
});

/**
 * This function will reset the reflection reminder flag in Mailchimp and notify slack.
 * @type {DocumentSnapshot}
 */
export const onReflectionResponseCreated = functions.firestore
.document(`${ Collection.reflectionResponses }/{responseId}`)
.onCreate(async (snapshot: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
    logger.log("ReflectionResponse created");
    const slackService = AdminSlackService.getSharedInstance();
    const reflectionResponse = fromDocumentSnapshot(snapshot, ReflectionResponse);

    if (!reflectionResponse) {
        await slackService.sendEngineeringMessage(`:warning: Unable to get reflection response from reflectionResponse.onCreate trigger. \nData: \`\`\`${ snapshot.data() }\`\`\``);
        return
    }

    let memberEmail = reflectionResponse.memberEmail;
    let member: CactusMember | undefined;
    const memberId = reflectionResponse.cactusMemberId;
    if (reflectionResponse.cactusMemberId) {
        member = await AdminCactusMemberService.getSharedInstance().getById(reflectionResponse.cactusMemberId);
        if (member?.email) {
            memberEmail = member.email;
        }
    }

    let prompt: ReflectionPrompt | undefined;
    if (reflectionResponse.promptId) {
        prompt = await AdminReflectionPromptService.getSharedInstance().get(reflectionResponse.promptId);
    }
    if (!prompt) {
        await slackService.sendEngineeringMessage(`\`ReflectionPromptCreatedTrigger\`: No \`ReflectionPrompt\` found in the data base for  for promptId \`${ reflectionResponse.promptId }\`. Member Email \`${ memberEmail }\``);
    }

    await AdminCactusMemberService.getSharedInstance().updateLastReplyByMemberId(memberId, new Date());
    logger.log("not resetting user reminder for email " + memberEmail)

    const { sentPrompt, created: sentPromptCreated } = await createSentPromptIfNeeded({
        member,
        prompt,
        reflectionResponse
    });

    await SlackManager.shared.notifyMemberActivity({ member, reflectionResponse, sentPromptCreated, sentPrompt   })
});

/**
 * For the given combination of Member + Prompt, get existing sent prompt, if it exists.
 * If no SentPrompt exists, create it, and save it.
 *
 * @param {{member?: CactusMember, prompt?: ReflectionPrompt, reflectionResponse?: ReflectionResponse}} options
 * @return {Promise<{created: boolean, sentPrompt?: SentPrompt}>}
 */
async function createSentPromptIfNeeded(options: {
    member?: CactusMember,
    prompt?: ReflectionPrompt,
    reflectionResponse?: ReflectionResponse
}): Promise<{ created: boolean, sentPrompt?: SentPrompt }> {
    const { member, prompt, reflectionResponse } = options;
    let sentPrompt = await AdminSentPromptService.getSharedInstance().getSentPromptForReflectionResponse(reflectionResponse)
    if (sentPrompt) {
        return { created: false, sentPrompt };
    }

    if (!member) {
        return { created: false };
    }

    const createPromptResult = AdminSentPromptService.createSentPrompt({
        member,
        createHistoryItem: true,
        medium: PromptSendMedium.PROMPT_CONTENT,
        promptId: prompt?.id,
        prompt: prompt,
    })

    if (!createPromptResult.sentPrompt) {
        return { created: false };
    }

    sentPrompt = createPromptResult.sentPrompt;
    const saved = await AdminSentPromptService.getSharedInstance().save(sentPrompt);

    return { sentPrompt: saved, created: true };

}

async function getSentPrompt(options: { member?: CactusMember, prompt?: ReflectionPrompt, reflectionResponse?: ReflectionResponse }): Promise<SentPrompt | undefined> {
    const { member, prompt, reflectionResponse } = options;
    if (member && member.id && prompt && prompt.id) {
        return AdminSentPromptService.getSharedInstance().getSentPromptForCactusMemberId({
            cactusMemberId: member.id,
            promptId: prompt.id
        })
    } else if (reflectionResponse && !reflectionResponse.anonymous) {
        const errorMessage = `Non-Anonymous reflection response Unable to search for sent prompt because no member and/or promptId was found\n Member: ${ member && member.email } | Prompt ${ prompt && prompt.id }`
        logger.warn(errorMessage);
        await AdminSlackService.getSharedInstance().sendAlertMessage(errorMessage)
    }
    return;
}