import {FirebaseCommand} from "@scripts/CommandTypes";
import * as admin from "firebase-admin";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import {getCactusConfig, Project} from "@scripts/config";
import MailchimpService from "@shared/services/MailchimpService";

import CactusMember from "@shared/models/CactusMember";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";

export default class MailchimpSyncMembersCommand extends FirebaseCommand {
    name = "Mailchimp: Sync Members";
    description = "Get mailchimp members and sync to firestore db";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService): Promise<void> {
        AdminCactusMemberService.initialize();
        const project = this.project || Project.STAGE;
        console.log("Using project", project);
        const config = await getCactusConfig(project);

        const mailchimpService = new MailchimpService(config.mailchimp.api_key, config.mailchimp.audience_id)
        const cactusMemberService = AdminCactusMemberService.getSharedInstance();

        await mailchimpService.getAllMembers({}, 50, 100 ,async (members) => {

            const tasks:Promise<CactusMember|undefined>[] = members.map(listMember => {
                return new Promise<CactusMember|undefined>(async resolve => {
                    const cactusMember = await cactusMemberService.updateFromMailchimpListMember(listMember);
                    resolve(cactusMember);
                })
            });
            await Promise.all(tasks);


            return;
        });


        return;
    }

}