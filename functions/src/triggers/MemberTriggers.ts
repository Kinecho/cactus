import * as functions from "firebase-functions";
import { Collection } from "@shared/FirestoreBaseModels";
import { fromDocumentSnapshot } from "@shared/util/FirestoreUtil";
import CactusMember from "@shared/models/CactusMember";
import AdminMemberProfileService from "@admin/services/AdminMemberProfileService";
import * as admin from "firebase-admin";
import MailchimpService from "@admin/services/MailchimpService";
import { MergeField } from "@shared/mailchimp/models/MailchimpTypes";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import Logger from "@shared/Logger";
import { getValidTimezoneName } from "@shared/timezones";
import AdminSlackService, { ChannelName } from "@admin/services/AdminSlackService";
import AdminSubscriptionService from "@admin/services/AdminSubscriptionService";
import UserRecord = admin.auth.UserRecord;

const logger = new Logger("MemberTriggers");

async function handlePromoActivityChange(member: CactusMember | undefined, before: CactusMember | undefined) {
    logger.info("Handling change");
    if (member?.currentOffer && member.currentOffer.entryId !== before?.currentOffer?.entryId) {
        await AdminSlackService.getSharedInstance().sendMessage(ChannelName.promo_activity, {
            text: `${ member.email } just applied Promotional Offer \`${ member.currentOffer.displayName?.trim() ?? member.currentOffer.entryId }\`${ before?.currentOffer?.entryId ? ` which replaced existing offer \`${ before.currentOffer?.displayName?.trim() ?? before.currentOffer.entryId }\`` : "" }.                        
            `.trim(),
        })
    }
}

/**
 * Ensure a member's subscription info is correct
 */
export const updateSubscriptionDetailsTrigger = functions.firestore
.document(`${ Collection.members }/{memberId}`)
.onWrite(async (change) => {
    if (!change.after) {
        logger.info("no \"after\" was found on the change. not doing anything");
        return;
    }

    const member = fromDocumentSnapshot(change.after, CactusMember);
    if (!member) {
        logger.info("No member was able to be built from the document snapshot. Returning");
        return;
    }
    const memberBefore = fromDocumentSnapshot(change.before, CactusMember);
    await handlePromoActivityChange(member, memberBefore);

    const subscription = member.subscription;
    if (!subscription) {
        logger.info("Member doesn't have a subscription, not doing anything");
        return;
    }
    let needsSave = false;
    const hasActivatedDate = !!subscription.trial?.activatedAt;
    if (hasActivatedDate && !subscription.activated) {
        logger.info(`setting ${ member.email } subscription to activated = true`);
        subscription.activated = true;
        needsSave = true;
    } else if (!hasActivatedDate && subscription.activated === true) {
        subscription.activated = false;
        logger.info(`setting ${ member.email } subscription to activated = false`);
        needsSave = true;
    }

    if (needsSave) {
        await AdminCactusMemberService.getSharedInstance().save(member);
    }

});

export const updatePromptSendTimeTrigger = functions.firestore
.document(`${ Collection.members }/{memberId}`)
.onWrite(async (change, context: functions.EventContext) => {
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

    // First, ensure the timezone is valid on the member, and if not, save it and return.
    // The next trigger will run the sent time update.
    const originalTz = memberAfter.timeZone || undefined;
    const validTz = getValidTimezoneName(originalTz);
    if (validTz && validTz !== originalTz) {
        const message = `Updating ${ memberAfter.email }'s timezone from '${ originalTz }' to '${ validTz }'.`;
        logger.info(message);
        await AdminSlackService.getSharedInstance().sendEngineeringMessage("[MemberTriggers.updatePromptSendTimeTrigger]" + message);
        memberAfter.timeZone = validTz;
        await afterSnapshot.ref.update({ [CactusMember.Field.timeZone]: validTz });
        return;
    }

    const result = await AdminCactusMemberService.getSharedInstance().updateMemberSendPromptTime(memberAfter);
    logger.log(JSON.stringify(result, null, 2));
});


export const updateMemberProfileTrigger = functions.firestore
.document(`${ Collection.members }/{memberId}`)
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


        const profile = await AdminMemberProfileService.getSharedInstance().upsertMember({ member, userRecord });
        logger.log("Updated profile to", profile);

    } catch (error) {
        logger.error(`Failed to update the member's public profile. MemberId = ${ member.id }`, error);
    }

    try {
        //update mailchimp, if needed
        const email = member?.email;
        const needsNameUpdate = MailchimpService.getSharedInstance().needsNameUpdate(member);
        const needsSubscriptionUpdate = MailchimpService.getSharedInstance().needsSubscriptionUpdate(member);

        const nameMergeFields = {
            [MergeField.FNAME]: member.firstName || "",
            [MergeField.LNAME]: member.lastName || "",
        };

        const subscriptionMergeFields = AdminSubscriptionService.getSharedInstance().mergeFieldValues(member);

        const mergeFieldsToUpdate = { ...nameMergeFields, ...subscriptionMergeFields };

        if (email) {
            if (needsNameUpdate || needsSubscriptionUpdate) {
                const mailchimpResponse = await MailchimpService.getSharedInstance().updateMergeFields({
                    email: email,
                    mergeFields: mergeFieldsToUpdate
                });
                logger.log("Update mailchimp merge fields response:", mailchimpResponse);
            }
        }
    } catch (error) {
        logger.log(`Failed to update mailchimp merge fields. MemberId = ${ member.id }`, error);
    }

    return;
});