import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import * as prompts from "prompts";
import {ExpireMembershipTrialJob} from "@api/pubsub/subscribers/ExpireMembershipTrialJob";
import {ExpireMembersJob} from "@admin/services/AdminSubscriptionService";

interface UserInput {
    email?: string | undefined,
    expireAll: boolean,
}

export default class ExpireMembersCommand extends FirebaseCommand {
    name = "Expire Members Command";
    description = "End a trial";
    showInList = true;
    userInput!: UserInput;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const userInput: UserInput = await prompts([
            {
                message: "Job Type",
                type: "toggle",
                name: "expireAll",
                initial: false,
                active: 'Expire All',
                inactive: "Choose One",
            }, {
                name: "email",
                message: "Email Address",
                type: (prev: boolean) => prev ? null : "text"
            }]) as UserInput;
        console.log("Got user input", userInput);
        this.userInput = userInput;


        if (userInput.expireAll) {
            // await job.expireAllDangerously()
            let payload: ExpireMembersJob | undefined = {
                batchSize: 100,
                batchNumber: 0,
            };

            while (payload) {
                job = new ExpireMembershipTrialJob();
                await job.expireBatch(payload);
                await job.sendDataLogMessage();
                payload = job.createNextBatchJob();
                console.log("result");
                console.log(job.getResult());

            }
        } else {
            const job = new ExpireMembershipTrialJob();
            await job.expireOne({email: userInput.email});
            console.log("result");
            console.log(job.getResult());
        }


        return;
    }

}