import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import * as prompts from "prompts";
import {submitJob} from "@admin/pubsub/SyncTrialMembersToMailchimpJob";

export default class SyncTrialToMailchimp extends FirebaseCommand {
    name = "Sync Trial To Mailchimp";
    description = "Update mailchimp merge tags";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        return new Promise(async resolve => {
            await this.doit();
        })


        // return;
    }

    async doit(): Promise<void> {

        const job = {batchNumber: 0, batchSize: 2};
        await submitJob(job);
        // const result = await AdminSubscriptionService.getSharedInstance().syncTrialingMemberWithMailchimpBatch(job);
        // console.log(chalk.blue(stringifyJSON(result, 2)));

        const {again} = await prompts({
            message: "Run it again?",
            name: "again",
            type: "confirm"
        });

        if (again) {
            await this.doit();
            // return;
        }
        // return Promise.resolve();
    }

}