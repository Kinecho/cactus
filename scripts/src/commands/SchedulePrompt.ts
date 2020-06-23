import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@admin/CactusConfig";
import {Project} from "@scripts/config";
import * as prompts from "prompts";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import PromptContentScheduler from "@admin/PromptContentScheduler";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import chalk from "chalk"
import {ContentStatus} from "@shared/models/PromptContent";
import AdminSlackService from "@admin/services/AdminSlackService";
import {buildPromptContentURL} from "@admin/util/StringUtil";

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
        // console.log("Scheduled date is of type date?", promptContent.scheduledSendAt instanceof Date);
        // console.log("Scheduled dated locale string", promptContent.scheduledSendAt?.toLocaleDateString());

        console.log(chalk.cyan(`Warning: Forcing the content status to be submitted. It was originally ${promptContent.contentStatus}`));
        promptContent.contentStatus = ContentStatus.submitted;

        const scheduler = new PromptContentScheduler({promptContent, config: this.config});
        const result = await scheduler.run();

        if (result.didPublish && result.promptContent.contentStatus === ContentStatus.published) {
            const link = buildPromptContentURL(promptContent, this.config);
            await AdminSlackService.getSharedInstance().sendDataLogMessage(`Prompt content has been scheduled ${promptContent.entryId} - ${promptContent.scheduledSendAt?.toLocaleDateString()}. <${link}|See it here>`)
        }

        console.log("======== SCHEDULE RESULT ========");
        if (result.success) {
            console.log(chalk.green(stringifyJSON(result, 2)));
        } else {
            console.log(chalk.red(stringifyJSON(result, 2)));
        }
        console.log(chalk.yellow(`scheduled send date: ${scheduler.promptContent.scheduledSendAt}`));
        console.log("=================================");

        const againInput = await prompts({type: "confirm", message: "Schedule another prompt?", name: "again"});
        if (againInput.again) {
            await this.processUserInput();
            return;
        }
        return;
    }

}