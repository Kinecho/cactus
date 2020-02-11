import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import * as prompts from "prompts";
import {ExpireMembershipTrialJob} from "@api/pubsub/subscribers/ExpireMembershipTrialJob";

interface UserInput {
    email: string
}

export default class ExpireMembersCommand extends FirebaseCommand {
    name = "Expire Members Command";
    description = "End a trial";
    showInList = true;
    userInput!: UserInput;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const userInput: UserInput = await prompts([{
            name: "email",
            message: "Email Address",
            type: "text"
        }]);
        console.log("Got user input", userInput);
        this.userInput = userInput;

        const job = new ExpireMembershipTrialJob();
        await job.expireOne({email: userInput.email});
        console.log("result");
        console.log(job.getResult());

        return;
    }

}