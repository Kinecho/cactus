import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import prompts from "prompts";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import chalk from "chalk";

interface UserInput {
    promptId: string
}

export default class GetPromptContentCommand extends FirebaseCommand {
    name = "Get Prompt Content Command";
    description = "Fetch prompt content by id";
    showInList = true;
    userInput!: UserInput;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        await this.getContent();


        return;
    }

    async getContent(): Promise<void> {
        const userInput: UserInput = await prompts([{
            name: "promptId",
            message: "Prompt ID",
            type: "text"
        }]);
        console.log("Got user input", userInput);
        this.userInput = userInput;

        const content = await AdminPromptContentService.getSharedInstance().getByPromptId(userInput.promptId);
        console.log(chalk.blue(JSON.stringify(content, null, 2)))

        const againResponse: { confirm: boolean } = await prompts({
            type: "confirm",
            message: "[DJ Kahled] Another One?",
            name: "confirm"
        });

        if (againResponse.confirm) {
            return this.getContent()
        }
    }

}