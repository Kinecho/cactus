import { FirebaseCommand } from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import { CactusConfig } from "@shared/CactusConfig";
import { Project } from "@scripts/config";
import CancelSubscriptionJob from "@admin/jobs/CancelSubscriptionJob";
import { stringifyJSON } from "@shared/util/ObjectUtil";

export default class CancelSubscriptions extends FirebaseCommand {
    name = "Cancel Subscriptions";
    description = "Cancel subscriptions that need it";
    showInList = true;

    protected async run(
    app: admin.app.App,
    firestoreService: AdminFirestoreService,
    config: CactusConfig
    ): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const job = new CancelSubscriptionJob();
        await job.run();
        const result = job.jobResult;
        console.log(stringifyJSON(result, 2));
        return;
    }
}
