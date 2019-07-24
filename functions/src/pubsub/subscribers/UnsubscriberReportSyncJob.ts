import MailchimpService from "@shared/services/MailchimpService";
import {DateTime} from "luxon";
import {ListMember, ListMemberStatus} from "@shared/mailchimp/models/MailchimpTypes";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import CactusMember from "@shared/models/CactusMember";
import AdminSlackService from "@shared/services/AdminSlackService";
import {getISODate} from "@shared/util/DateUtil";


export async function onPublish() {
    const mailchimpService = MailchimpService.getSharedInstance();
    const unsubLookback = DateTime.fromJSDate(new Date()).minus({days: 2}).toISODate();
    const unsubscribers = await mailchimpService.getAllMembers({
        unsubscribed_since: unsubLookback,
        status: ListMemberStatus.unsubscribed
    });

    console.log(`Got ${unsubscribers.length} unsubscribers`);
    const updates: { cactusMember?: CactusMember, mailchimpListMember: ListMember }[] = [];
    for (const unsubscriber of unsubscribers) {
        const cactusMember = await AdminCactusMemberService.getSharedInstance().updateFromMailchimpListMember(unsubscriber);
        updates.push({cactusMember, mailchimpListMember: unsubscriber});
    }

    const summary = updates.filter(u => u.cactusMember).map(u => {
        return {
            cactusMemberId: u.cactusMember ? u.cactusMember.id : undefined,
            email: u.cactusMember ? u.cactusMember.email : u.mailchimpListMember.email_address,
            status: u.mailchimpListMember.status,
            reason: u.mailchimpListMember.unsubscribe_reason,
            unsubscribeDate: (u.cactusMember && u.cactusMember.unsubscribedAt) ? getISODate(u.cactusMember.unsubscribedAt) : "unknown",
        }
    });

    await AdminSlackService.getSharedInstance().sendDataLogMessage({
        text: `Updated unsubscriber info for ${updates.length} members`,
        attachments: [{
            title: 'Unsubscribe Details',
            text: `\`\`\`${JSON.stringify(summary, null, 2)}\`\`\``
        }]
    })
}