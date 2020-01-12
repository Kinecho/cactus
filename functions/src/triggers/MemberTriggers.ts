import * as functions from "firebase-functions";
import {Collection} from "@shared/FirestoreBaseModels";
import {fromDocumentSnapshot} from "@shared/util/FirestoreUtil";
import CactusMember from "@shared/models/CactusMember";
import AdminMemberProfileService from "@admin/services/AdminMemberProfileService";
import * as admin from "firebase-admin";
import MailchimpService from "@admin/services/MailchimpService";
import {MergeField} from "@shared/mailchimp/models/MailchimpTypes";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import UserRecord = admin.auth.UserRecord;
import {getArrayChanges} from "@shared/util/ObjectUtil";

export const updatePromptSendTimeTrigger = functions.firestore
    .document(`${Collection.members}/{memberId}`)
    .onWrite(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
        const memberId = context.params.memberId;
        console.log(`Starting Member.UpdatePromptSendTime trigger for memberId = ${memberId}`);
        const afterSnapshot = change.after;
        if (!afterSnapshot) {
            console.warn("No data found on the 'after' snapshot. Not updating.");
            return;
        }
        const memberAfter = fromDocumentSnapshot(afterSnapshot, CactusMember);
        if (!memberAfter) {
            console.error("There was no updated member. It was deleted. Nothing to process");
            return;
        }

        try {
            const beforeMember = change.before ? fromDocumentSnapshot(change.before, CactusMember) : undefined;

            const doUpdate = needsNotificationUpdate({member: memberAfter, beforeMember});
            if (!doUpdate) {
                console.info("No notification changes are needed, returning.");
                return;
            }
            console.log("About to start the refreshMemberNotificationSettings job");
            // const result = await AdminCactusMemberService.getSharedInstance().updateMemberUTCSendPromptTime(memberAfter);
            // console.log(JSON.stringify(result, null, 2));
            AdminCactusMemberService.getSharedInstance().refreshMemberNotificationSettings({
                member: memberAfter,
                useDefaultTime: true
            })
        } catch (error) {
            console.error(`[MemberTrigger.onWriate] Unexpected error while running the refresh notification settings job. MemberId=${memberAfter.id}`, error)
        }
    });

/**
 * Check if there are any relevant changes to the member document. Checks, in this order:
 *  - fcmTokens
 *  - TimeZone
 *  - sendPromptTime Hour
 *  - sendPromtTime Minute
 * @param {{member: CactusMember, beforeMember?: CactusMember}} options
 * @return {boolean}
 */
function needsNotificationUpdate(options: { member: CactusMember, beforeMember?: CactusMember }): boolean {
    const {member, beforeMember} = options;
    if (!beforeMember) {
        return true;
    }
    const tokens = member.fcmTokens || [];
    const oldTokens = beforeMember?.fcmTokens || [];

    const tokenChanges = getArrayChanges({current: tokens, previous: oldTokens});
    if (tokenChanges.hasChanges) {
        return true;
    }

    const beforeTz = member.timeZone;
    const afterTz = beforeMember?.timeZone;
    if (beforeTz !== afterTz) {
        return true;
    }

    const {hour, minute} = member.promptSendTime || {};
    const {hour: beforeHour, minute: beforeMinute} = beforeMember?.promptSendTime || {};

    if (hour !== beforeHour) {
        return true;
    }

    if (minute !== beforeMinute) {
        return true;
    }

    return false;
}

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
            console.error("Unable to deserialize a cactus member from the after snapshot. snapshot.data() was", JSON.stringify(snapshot.data(), null, 2));
            return;
        }

        //update the public profile
        try {
            const userId = member.userId;
            let userRecord: UserRecord | undefined = undefined;
            if (userId) {
                userRecord = await admin.auth().getUser(userId);
            }


            const profile = await AdminMemberProfileService.getSharedInstance().upsertMember({member, userRecord});
            console.log("Updated profile to", profile);

        } catch (error) {
            console.error(`Failed to update the member's public profile. MemberId = ${member.id}`, error);
        }

        try {
            //update mailchimp
            const mailchimpMember = member.mailchimpListMember;
            const email = member.email || mailchimpMember?.email_address;
            if (!email) {
                return;
            }
            if (mailchimpMember?.merge_fields[MergeField.FNAME] !== member.firstName || mailchimpMember?.merge_fields[MergeField.LNAME] !== member.lastName) {
                const mailchimpResponse = await MailchimpService.getSharedInstance().updateMergeFields({
                    email: email,
                    mergeFields: {
                        [MergeField.FNAME]: member.firstName || "",
                        [MergeField.LNAME]: member.lastName || "",
                    }
                });
                console.log("Update mailchimp merge fields response:", mailchimpResponse);
            }
        } catch (error) {
            console.log(`Failed to update mailchimp merge fields. MemberId = ${member.id}`, error);
        }

        return;
    });