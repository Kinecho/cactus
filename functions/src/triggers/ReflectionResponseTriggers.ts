import * as functions from "firebase-functions";
import { Collection } from "@shared/FirestoreBaseModels";
import { fromDocumentSnapshot } from "@shared/util/FirestoreUtil";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import AdminReflectionManager from "@admin/managers/AdminReflectionManager";

export const onWriteReflectionResponse = functions.firestore
.document(`${ Collection.reflectionResponses }/{responseId}`)
.onWrite(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
    const currentReflection = fromDocumentSnapshot(change.after, ReflectionResponse);
    const previousReflection = fromDocumentSnapshot(change.before, ReflectionResponse);
    await AdminReflectionManager.shared.handleReflectionChange({before: previousReflection, after: currentReflection})
});
