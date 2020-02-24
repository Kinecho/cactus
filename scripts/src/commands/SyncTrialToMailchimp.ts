import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import * as prompts from "prompts";
import AdminSubscriptionService from "@admin/services/AdminSubscriptionService";

export default class SyncTrialToMailchimp extends FirebaseCommand {
    name = "Sync Trial To Mailchimp";
    description = "Update mailchimp merge tags";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        await this.doit();

        return;
    }

    async doit(): Promise<void> {
        const {batchSize} = await prompts({type: "number", message: "batch size", name: "batchSize"});
        const job = {batchNumber: 0, batchSize};
        let result = await AdminSubscriptionService.getSharedInstance().syncTrialingMemberWithMailchimpBatch(job);
        console.log("First job finished. Result", JSON.stringify(result, null, 2));
        let nextJob = AdminSubscriptionService.getSharedInstance().buildNextMailchimpSyncJob(result, job);
        while (nextJob) {
            console.log("Submitting next job", JSON.stringify(nextJob, null, 2));
            result = await AdminSubscriptionService.getSharedInstance().syncTrialingMemberWithMailchimpBatch(nextJob);
            nextJob = AdminSubscriptionService.getSharedInstance().buildNextMailchimpSyncJob(result, nextJob)
        }
        console.log("done with jobs");

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