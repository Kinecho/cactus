import * as functions from "firebase-functions";
import * as admin from "firebase-admin"
import {Collection} from "@shared/FirestoreBaseModels";
import {fromDocumentSnapshot} from "@shared/util/FirestoreUtil";
import SentPrompt from "@shared/models/SentPrompt";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import CactusMember from "@shared/models/CactusMember";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import AdminReflectionPromptService from "@shared/services/AdminReflectionPromptService";
import * as Sentry from "@sentry/node";
import AdminSlackService from "@shared/services/AdminSlackService";

/**
 * The purpose of this method is to send a push notification to the recipient of a new SentPrompt!
 * @type {CloudFunction<DocumentSnapshot>}
 */
export const sentPromptPushNotificationTrigger = functions.firestore
    .document(`${Collection.sentPrompts}/{sentPromptId}`)
    .onCreate(async (snapshot: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
        const sentPrompt = fromDocumentSnapshot(snapshot, SentPrompt);
        if (!sentPrompt) {
            console.log("No sent prompt was able to be processed. Returning");
            return
        }

        const memberId = sentPrompt.cactusMemberId;
        const promptId = sentPrompt.promptId;
        if (!memberId || !promptId) {
            console.warn("No cactus member Id  or promptId was found on the sentPrompt. Id = " + sentPrompt.id);
            return
        }
        const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
        const prompt = await AdminReflectionPromptService.getSharedInstance().get(promptId);

        if (!member || !prompt) {
            console.warn("No Cactus Member or ReflectionPrompt could be found. Exiting");
            return;
        }
        await sendPush(member, prompt);


    });


async function sendPush(member: CactusMember, prompt: ReflectionPrompt): Promise<any> {

    const messaging = admin.messaging();

    if (!member.fcmTokens || !member.fcmTokens.length) {
        console.log("Member doesn't have any device tokens. Returning");
        return
    }

    const tokens = member.fcmTokens;
    const tasks: Promise<any>[] = tokens.map(token => {
        return new Promise(async (resolve, reject) => {
            try {
                const payload: admin.messaging.MessagingPayload = {
                    notification: {
                        title: `Your daily question from Cactus`,
                        body: `${prompt.question}`
                    }
                };
                const result = await messaging.sendToDevice(token, payload);

                console.log("Send Message Result", result);
                resolve(token);
                return;

            } catch (error) {
                Sentry.captureException(error);
                await AdminSlackService.getSharedInstance().sendDataLogMessage(`:ios: Failed to send push notification to member ${member.email} ${member.id}`)
            }


        })
    });

    const results = await Promise.all(tasks);
    console.log(`Got ${results.length} resuluts`);

}