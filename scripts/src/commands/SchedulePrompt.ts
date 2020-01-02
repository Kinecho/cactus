import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import * as prompts from "prompts";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import PromptContentScheduler from "@admin/PromptContentScheduler";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import chalk from "chalk"

interface UserInput {
    entryId: string
}

export default class SchedulePrompt extends FirebaseCommand {
    name = "Schedule Prompt";
    description = "Test the prompt schedule trigger";
    showInList = true;
    userInput!: UserInput;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        await this.processUserInput();
        return;
    }

    async processUserInput(): Promise<void> {
        const userInput: UserInput = await prompts([{
            name: "entryId",
            message: "Prompt Content Entry ID",
            type: "text",
            initial: this.userInput?.entryId || undefined,
        }]);
        console.log("Got user input", userInput);
        this.userInput = userInput;

        const promptContent = await AdminPromptContentService.getSharedInstance().getByEntryId(userInput.entryId);
        if (!promptContent) {
            console.error("No prompt content found for entryId", userInput.entryId);
            return;
        }
        console.log(chalk.yellow("Found prompt content in database. Setting up the scheduler"));

        const scheduler = new PromptContentScheduler({promptContent});
        const result = await scheduler.run();

        console.log("======== SCHEDULE RESULT ========");
        if (result.success) {
            console.log(chalk.green(stringifyJSON(result, 2)));
        } else {
            console.log(chalk.red(stringifyJSON(result, 2)));
        }
        console.log(chalk.yellow(`scheduled send date: ${scheduler.promptContent.scheduledSendAt}`))
        console.log("=================================");

        const againInput = await prompts({type: "confirm", message: "Schedule another prompt?", name: "again"});
        if (againInput.again) {
            return this.processUserInput();
        }
        return;
    }

}