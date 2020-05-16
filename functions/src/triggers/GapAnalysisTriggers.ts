import * as functions from "firebase-functions";
import { Collection } from "@shared/FirestoreBaseModels";

import Logger from "@shared/Logger"
import AdminSlackService from "@admin/services/AdminSlackService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import CactusMember from "@shared/models/CactusMember";

const logger = new Logger("GapAnalysisTriggers");


/**
 * Ensure a member's subscription info is correct
 */
export const gapAssessmentCompleted = functions.firestore
.document(`${ Collection.gapAnalysisAssessmentResults }/{id}`)
.onWrite(async (change) => {
    if (!change.after) {
        logger.info("no \"after\" was found on the change. not doing anything");
        return;
    }

    const beforeCompleted = change.before?.get("completed");
    const afterCompleted = change.after.get("completed");


    if (afterCompleted === true && !beforeCompleted) {
        const memberId = change.after.get("memberId") as string | null | undefined;
        let member: CactusMember | null | undefined = null;
        if (memberId) {
            member = await AdminCactusMemberService.getSharedInstance().getById(memberId)
        }

        await AdminSlackService.getSharedInstance().sendActivityMessage(`${ member?.email ?? "Unknown member" } has completed the Gap Analysis Assessment`);
    }
})