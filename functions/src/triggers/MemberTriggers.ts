import * as functions from "firebase-functions";
import {Collection} from "@shared/FirestoreBaseModels";
import {fromDocumentSnapshot} from "@shared/util/FirestoreUtil";
import CactusMember from "@shared/models/CactusMember";
import AdminMemberProfileService from "@admin/services/AdminMemberProfileService";
import * as admin from "firebase-admin";
import UserRecord = admin.auth.UserRecord;


export const updateMemberProfileTrigger = functions.firestore
    .document(`${Collection.members}/{memberId}`)
    .onWrite(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
        console.log("Starting member profile update");

        const snapshot = change.after;
        if (!snapshot) {
            console.warn("No data found on the 'after' snapshot. Not updating.");
            return;
        }
        const member = fromDocumentSnapshot(snapshot, CactusMember);

        if (!member) {
            console.error("Unable to deserialize a cactus member from the after snapshot. snapshot.data() was", snapshot.data());
            return;
        }

        const userId = member.userId;
        let userRecord: UserRecord | undefined = undefined;
        if (userId) {
            userRecord = await admin.auth().getUser(userId);
        }

        const profile = await AdminMemberProfileService.getSharedInstance().upsertMember({member, userRecord});
        console.log("Updated profile to", profile);
        return;
    });