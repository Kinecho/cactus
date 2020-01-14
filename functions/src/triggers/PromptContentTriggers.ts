import * as functions from "firebase-functions";
import {Collection} from "@shared/FirestoreBaseModels";
import PromptContent, {ContentStatus} from "@shared/models/PromptContent";
import PromptContentScheduler from "@admin/PromptContentScheduler";
import {fromFlamelinkData} from "@shared/util/FlamelinkUtils";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import {getConfig} from "@admin/config/configService";
import AdminSlackService from "@admin/services/AdminSlackService";
import {buildPromptContentURL} from "@admin/util/StringUtil";
import Logger from "@shared/Logger";

const logger = new Logger("PromptContentTriggers");

export const onContentPublished = functions.firestore
    .document(`${Collection.flamelink_content}/{documentId}`)
    .onWrite(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext): Promise<void> => {
        const beforeStatus = change.before.get(PromptContent.Fields.contentStatus);
        const afterStatus = change.after.get(PromptContent.Fields.contentStatus);

        if (afterStatus !== ContentStatus.submitted) {
            logger.log("Content is not of status \"submitted\", not processing");
            return;
        }

        if (beforeStatus === ContentStatus.submitted) {
            logger.log("status of the before snapshot was also submitted, not processing.")
            return;
        }

        const promptContent = fromFlamelinkData(change.after.data(), PromptContent);

        if (!promptContent) {
            logger.error("Unable to parse prompt content from firestore data", change.after.data());
        }
        const config = getConfig();
        const job = new PromptContentScheduler({promptContent, config: config});

        const result = await job.run();
        logger.log("result is ", stringifyJSON(result));

        if (result.promptContent.contentStatus === ContentStatus.published) {
            const link = buildPromptContentURL(promptContent);
            await AdminSlackService.getSharedInstance().sendDataLogMessage(`Prompt content has been scheduled ${promptContent.entryId} - ${promptContent.scheduledSendAt?.toLocaleDateString()}. <See it here|${link}>`)
        }

        return;
    });

