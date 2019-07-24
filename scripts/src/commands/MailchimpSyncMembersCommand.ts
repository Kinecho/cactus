import {FirebaseCommand} from "@scripts/CommandTypes";
import * as admin from "firebase-admin";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import {getCactusConfig, Project} from "@scripts/config";
import MailchimpService from "@shared/services/MailchimpService";

import CactusMember from "@shared/models/CactusMember";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import {
    ActivityActionType,
    ListMemberStatus,
    MemberActivity,
    MemberUnsubscribeReport
} from "@shared/mailchimp/models/MailchimpTypes";
import chalk from "chalk";

export default class MailchimpSyncMembersCommand extends FirebaseCommand {
    name = "Mailchimp: Sync Members";
    description = "Get mailchimp members and sync to firestore db";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService): Promise<void> {
        AdminCactusMemberService.initialize();
        const project = this.project || Project.STAGE;
        console.log("Using project", project);
        const config = await getCactusConfig(project);

        const mailchimpService = new MailchimpService(config.mailchimp.api_key, config.mailchimp.audience_id);
        const cactusMemberService = AdminCactusMemberService.getSharedInstance();

        await mailchimpService.getAllMembers({}, 200, 100, async (members) => {

            const tasks: Promise<CactusMember | undefined>[] = members.map(listMember => {
                return new Promise<CactusMember | undefined>(async resolve => {
                    let unsubReport: MemberUnsubscribeReport | undefined = undefined;
                    if (listMember.status === ListMemberStatus.unsubscribed && listMember.email_address) {
                        const unsubActivity = await this.getUnsubActivity(listMember.email_address, mailchimpService);
                        if (unsubActivity) {
                            unsubReport = await mailchimpService.getUnsubscribeReportForMember({
                                campaignId: unsubActivity.campaign_id,
                                email: listMember.email_address
                            })
                        }
                    }

                    const cactusMember = await cactusMemberService.updateFromMailchimpListMember(listMember, unsubReport);
                    resolve(cactusMember);
                })
            });
            await Promise.all(tasks);


            return;
        });


        return;
    }

    async getUnsubActivity(email: string, mailchimpService: MailchimpService): Promise<MemberActivity | undefined> {
        const memberActivityPage = await mailchimpService.getMemberActivity(email);
        if (memberActivityPage && memberActivityPage.activity.length > 0) {
            const unsubActivity = memberActivityPage.activity.find(activity => activity.action === ActivityActionType.unsub);

            console.log(chalk.yellow(`Found unsub report for ${email} \n`, JSON.stringify(unsubActivity, null, 2)));
            return unsubActivity;
        }
        return;
    }

}