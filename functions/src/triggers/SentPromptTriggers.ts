import * as functions from "firebase-functions";
import { Collection } from "@shared/FirestoreBaseModels";
import { fromDocumentSnapshot } from "@shared/util/FirestoreUtil";
import SentPrompt, { PromptSendMedium } from "@shared/models/SentPrompt";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import CactusMember, { DEFAULT_PROMPT_SEND_TIME } from "@shared/models/CactusMember";
import ReflectionPrompt, { PromptType } from "@shared/models/ReflectionPrompt";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import PushNotificationService from "@admin/services/PushNotificationService";
import { NewPromptNotificationPushResult } from "@admin/PushNotificationTypes";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import { isSendTimeWindow } from "@shared/util/NotificationUtil";
import Logger from "@shared/Logger";

const logger = new Logger("SendPromptTriggers");
/**
 * The purpose of this method is to send a push notification to the recipient of a new SentPrompt!
 * @type {CloudFunction<DocumentSnapshot>}
 */
export const sentPromptPushNotificationTrigger = functions.runWith({ timeoutSeconds: 300, memory: "512MB" }).firestore
.document(`${ Collection.sentPrompts }/{sentPromptId}`)
.onCreate(async (snapshot: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
    try {
        const sentPrompt = fromDocumentSnapshot(snapshot, SentPrompt);
        if (!sentPrompt) {
            logger.log("No sent prompt was able to be processed. Returning");
            return
        }

        const memberId = sentPrompt.cactusMemberId;
        const promptId = sentPrompt.promptId;
        const isFreeForm = sentPrompt.containsMedium(PromptSendMedium.FREE_FORM) || sentPrompt.promptType === PromptType.FREE_FORM
        if (isFreeForm) {
            logger.info("The prompt was created by the user - no need to send notifications");
            return;
        }

        if (!memberId || !promptId) {
            logger.warn("No cactus member Id  or promptId was found on the sentPrompt. Id = " + sentPrompt.id);
            return
        }
        const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
        const prompt = await AdminReflectionPromptService.getSharedInstance().get(promptId);

        if (!member || !prompt) {
            logger.warn("No Cactus Member or ReflectionPrompt could be found. Exiting");
            return;
        }
        await sendPush({ member, prompt, sentPrompt });
    } catch (error) {
        logger.error("Failed to execute sent prompt trigger", error);
    }
});


async function sendPush(options: { member: CactusMember, prompt: ReflectionPrompt, sentPrompt: SentPrompt }): Promise<NewPromptNotificationPushResult | undefined> {
    const { member, sentPrompt, prompt } = options;
    const userDateObject = member.getCurrentLocaleDateObject();
    const userPromptSendTime = member.promptSendTime || DEFAULT_PROMPT_SEND_TIME;
    const isSendTime = isSendTimeWindow({ currentDate: userDateObject, sendTime: userPromptSendTime });

    const isFreeForm = prompt.promptType === PromptType.FREE_FORM;
    if (isFreeForm) {
        logger.info("The prompt is of type FREE_FORM, no need to send notifications");
        return undefined;
    }
    if (isSendTime) {
        // return await PushNotificationService.sharedInstance.sendPromptNotification({member, prompt})

        const pushResult = await PushNotificationService.sharedInstance.sendNewPromptPushIfNeeded({
            member,
            prompt,
            sentPrompt,
        });

        if (pushResult?.atLeastOneSuccess) {
            sentPrompt.sendHistory.push({
                medium: PromptSendMedium.PUSH,
                sendDate: new Date(),
                usedMemberCustomTime: true,
            });
        }
        await AdminSentPromptService.getSharedInstance().save(sentPrompt);
        return pushResult;
    }
    return undefined;
}