import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import AdminSubscriptionService from "@admin/services/AdminSubscriptionService";
import chalk from "chalk";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import * as prompts from "prompts";

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
        const result = await AdminSubscriptionService.getSharedInstance().syncTrialingMemberWithMailchimpBatch({batchNumber: 0});
        console.log(chalk.blue(stringifyJSON(result)));

        const {again} = await prompts({
            message: "Run it again?",
            name: "again",
            type: "confirm"
        });

        if (again) {
            await this.doit();
            return;
        }
        return Promise.resolve();
    }

}