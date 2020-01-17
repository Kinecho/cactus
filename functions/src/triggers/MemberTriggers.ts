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
import Logger from "@shared/Logger";
const logger = new Logger("MemberTriggers");
export const updatePromptSendTimeTrigger = functions.firestore
    .document(`${Collection.members}/{memberId}`)
    .onWrite(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
        logger.log("Starting update prompt send time trigger");
        const afterSnapshot = change.after;
        if (!afterSnapshot) {
            logger.warn("No data found on the 'after' snapshot. Not updating.");
            return;
        }
        const memberAfter = fromDocumentSnapshot(afterSnapshot, CactusMember);
        if (!memberAfter) {
            logger.error("There was no updated member. It was deleted. Nothing to process");
            return;
        }

        const result = await AdminCactusMemberService.getSharedInstance().updateMemberSendPromptTime(memberAfter);
        logger.log(JSON.stringify(result, null, 2));        
    });


export const updateMemberProfileTrigger = functions.firestore
    .document(`${Collection.members}/{memberId}`)
    .onWrite(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
        logger.log("Starting member profile update");

        const snapshot = change.after;
        if (!snapshot) {
            logger.warn("No data found on the 'after' snapshot. Not updating.");
            return;
        }
        const member = fromDocumentSnapshot(snapshot, CactusMember);

        if (!member) {
            logger.error("Unable to deserialize a cactus member from the after snapshot. snapshot.data() was", JSON.stringify(snapshot.data(), null, 2));
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
            logger.log("Updated profile to", profile);

        } catch (error) {
            logger.error(`Failed to update the member's public profile. MemberId = ${member.id}`, error);
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
                logger.log("Update mailchimp merge fields response:", mailchimpResponse);
            }
        } catch (error) {
            logger.log(`Failed to update mailchimp merge fields. MemberId = ${member.id}`, error);
        }

        return;
    });