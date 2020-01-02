import * as functions from "firebase-functions";
import {Collection} from "@shared/FirestoreBaseModels";
import PromptContent, {ContentStatus} from "@shared/models/PromptContent";
import PromptContentScheduler from "@admin/PromptContentScheduler";
import {fromFlamelinkData} from "@shared/util/FlamelinkUtils";
import {stringifyJSON} from "@shared/util/ObjectUtil";


export const onContentPublished = functions.firestore
    .document(`${Collection.flamelink_content}/{documentId}`)
    .onWrite(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext): Promise<void> => {
        const beforeStatus = change.before.get(PromptContent.Fields.contentStatus);
        const afterStatus = change.after.get(PromptContent.Fields.contentStatus);

        if (afterStatus !== ContentStatus.submitted) {
            console.log("Content is not of status \"submitted\", not processing");
            return;
        }

        if (beforeStatus === ContentStatus.submitted) {
            console.log("status of the before snapshot was also submitted, not processing.")
        }

        const promptContent = fromFlamelinkData(change.after.data(), PromptContent);

        if (!promptContent) {
            console.error("Unable to parse prompt content from firestore data", change.after.data());
        }

        const job = new PromptContentScheduler({promptContent});

        const result = await job.run();
        console.log("result is ", stringifyJSON(result));
        return;
    });

