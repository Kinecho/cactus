import * as functions from "firebase-functions";
import { Collection } from "@shared/FirestoreBaseModels";
import Logger from "@shared/Logger";
import CoreValuesAssessmentResponse, { CoreValuesResults } from "@shared/models/CoreValuesAssessmentResponse";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";

const logger = new Logger("CoreValuesAssessmentResponseTriggers");

export const updateMemberCoreValueFromAssessment = functions.firestore
.document(`${ Collection.coreValuesAssessmentResponses }/{id}`)
.onWrite(async (change) => {
    const data = change.after?.data();
    if (!change.after || !data) {
        logger.info("no \"after\" was found on the change. not doing anything");
        return;
    }
    const completed = change.after?.get(CoreValuesAssessmentResponse.Fields.completed) as boolean | undefined;
    if (!completed) {
        return;
    }

    const results = change.after?.get(CoreValuesAssessmentResponse.Fields.results) as CoreValuesResults | undefined;
    const memberId = change.after?.get(CoreValuesAssessmentResponse.Fields.memberId) as string | undefined;
    if (!results || !memberId) {
        logger.info("CoreValues Assessment Response does not have a member ID or a results object")
        return;
    }

    const values = results.values ?? [];
    try {
        await AdminCactusMemberService.getSharedInstance().setCoreValues(memberId, values);
    } catch (error) {
        logger.error("Failed to update the cactus member", error);
    }

})