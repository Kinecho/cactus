import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import {CactusElement} from "@shared/models/CactusElement";
import * as csv from "csvtojson"
import * as path from "path";
import helpers from "@scripts/helpers";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import PromptContent from "@shared/models/PromptContent";
import chalk from "chalk";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import * as prompts from "prompts"
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";

interface DataRow {
    element: CactusElement,
    question: string,
    promptId: string,
}

interface RowResult {
    error?: any,
    promptContent?: PromptContent | undefined
}

interface SetupResponse {
    backfillResponses: boolean,
}

export default class PromptContentSetElementCommand extends FirebaseCommand {
    name = "Prompt Content - Set Elements";
    description = "Set the Prompt Content Element on all Prompt Content and Reflection Responses";
    showInList = true;

    dataFileName = "questions_elements_2019-10-21.csv";
    inputData: DataRow[] = [];
    promptContentService!: AdminPromptContentService;
    setupResponse!: SetupResponse;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        this.setupResponse = await prompts([{
            message: "Do you want to also back-fill ReflectionResponses?",
            type: "confirm",
            name: "backfillResponses"
        }]);


        this.promptContentService = AdminPromptContentService.getSharedInstance();

        this.inputData = await this.loadCsv();

        let tasks: Promise<RowResult>[] = this.inputData.map(row => this.updatePromptContent(row));
        await Promise.all(tasks);
        console.log("All rows processed");

        return;
    }

    async updatePromptContent(row: DataRow): Promise<RowResult> {
        try {
            console.log("processing row", row);
            let promptContent = await this.promptContentService.getByPromptId(row.promptId);
            if (!promptContent) {
                console.log("no content found on row");
                return {error: `No content was found for promptId ${row.promptId}`}
            }
            console.log("found prompt content for promptId", row.promptId);
            if (!row.element) {
                console.log("No element found on row");
                return {error: `No element was found on row for promptId ${row.promptId}`}
            }

            promptContent.cactusElement = row.element;
            let [first] = promptContent.content;
            if (first) {
                first.showElementIcon = true
            }

            await this.promptContentService.save(promptContent);
            console.log("updated content for promptId", row.promptId);


            if (this.setupResponse.backfillResponses) {
                const responses = await this.backfillReflectionResponses(promptContent);
                console.log(chalk.green(`backfilled ${responses.length} reflection responses for element ${promptContent.cactusElement} | entryId = ${promptContent.entryId}`));
            }

            return {promptContent: promptContent}
        } catch (error) {
            console.error(chalk.red("failed to update prompt", error));
            return {error}
        }
    }

    async backfillReflectionResponses(promptContent: PromptContent): Promise<ReflectionResponse[]> {
        if (!promptContent.promptId) {
            console.warn(chalk.yellow(`No promptId found on promptContent entryId ${promptContent.entryId}`));
            return []
        }
        console.log(chalk.yellow(`backfilling reflection responses for prompt content element for promptId = ${promptContent.promptId}`));

        const responses = await AdminReflectionResponseService.getSharedInstance().getResponsesForPromptId(promptContent.promptId);

        const tasks: Promise<ReflectionResponse>[] = [];
        responses.filter(response => response.cactusElement != promptContent.cactusElement)
            .map(response => {
                response.cactusElement = promptContent.cactusElement || null;
                tasks.push(AdminReflectionResponseService.getSharedInstance().save(response))
            });

        return await Promise.all(tasks);
    }

    async loadCsv(): Promise<DataRow[]> {
        const filePath = path.join(helpers.dataDir, this.dataFileName);
        console.log("file path", filePath);
        const rows: DataRow[] = await csv().fromFile(filePath);
        console.log(`parsed ${rows.length} rows`);
        return rows
    }

}