import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import chalk from "chalk";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import SentPrompt from "@shared/models/SentPrompt";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";

interface ExecuteResult {
    results: BatchResult[],
    error?: any,
}

interface BatchResult {
    numSuccess: number,
    numError: number,
    numUpdated: number,
    numSkipped: number,
    numComplete: number,
    numNotComplete: number,
    errors?: string[],
}

interface TaskResult {
    updated: boolean,
    isComplete?: boolean,
    error?: string,
}

interface TotalResult {
    success: number,
    error: number,
    updated: number,
    skipped: number,
    errorMessages: string[]
}

export default class SentPromptCompletedSyncCommand extends FirebaseCommand {
    name = "Sent Prompt Completed Sync Command";
    description = "Mark sent prompts as completed if they have a response";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const result = await this.execute();

        if (result.error) {
            console.error(chalk.red(result.error));
        }
        console.log(chalk.blue(`completed with result ${JSON.stringify(result, null, 2)}`));
        console.log("");

        const initialTotal: TotalResult = {success: 0, error: 0, updated: 0, skipped: 0, errorMessages: []};
        const totals: TotalResult = result.results.reduce((total, r) => {
            total.success += r.numSuccess;
            total.skipped += r.numSkipped;
            total.error += r.numError;
            total.updated += r.numUpdated;
            if (r.errors) {
                total.errorMessages.push(...r.errors)
            }

            return total;
        }, initialTotal);

        console.log(`Result Summary: ${JSON.stringify(totals, null, 2)}`);
        return;
    }

    async execute(): Promise<ExecuteResult> {
        const results: BatchResult[] = [];
        try {
            await AdminSentPromptService.getSharedInstance().getAllBatch({
                batchSize: 100,
                onData: async (sentPrompts, batchNumber) => {
                    const result = await this.handleBatch(sentPrompts, batchNumber);
                    results.push(result);
                    return;
                }
            });
        } catch (error) {
            return {results, error}
        }

        return {
            results,
        }
    }

    async handleBatch(sentPrompts: SentPrompt[], batchNumber: number): Promise<BatchResult> {
        const batchResult: BatchResult = {
            numSuccess: 0,
            numUpdated: 0,
            numSkipped: 0,
            numError: 0,
            numComplete: 0,
            numNotComplete: 0,
            errors: []
        };

        const tasks: Promise<TaskResult>[] = sentPrompts.map(this.handleSentPrompt);
        const taskResults: TaskResult[] = await Promise.all(tasks);

        taskResults.forEach(result => {
            if (!result.error) {
                batchResult.numSuccess += 1;
            } else {
                batchResult.numError += 1;
                batchResult.errors?.push(result.error);
            }

            if (result.updated) {
                batchResult.numUpdated += 1;
            } else {
                batchResult.numSkipped += 1;
            }

            if (result.isComplete) {
                batchResult.numComplete += 1;
            } else if (result.isComplete === false) {
                batchResult.numNotComplete += 1;
            }

        });

        return batchResult;
    }

    async handleSentPrompt(sentPrompt: SentPrompt): Promise<TaskResult> {
        try {
            if (sentPrompt.completed) {
                return {
                    isComplete: true,
                    updated: false,
                }
            }

            const memberId = sentPrompt.cactusMemberId;
            const promptId = sentPrompt.promptId;

            if (!memberId || !promptId) {
                return {
                    updated: false,
                    error: `Either memberId or PromptId was not found. SentPromptId = ${sentPrompt.id}. MemberId = ${memberId}. PromptId = ${promptId}`,
                }
            }

            const responses = await AdminReflectionResponseService.getSharedInstance().getMemberResponsesForPromptId({
                memberId,
                promptId
            });

            let completed = false;
            let completedAt: Date | undefined = undefined;
            if (responses && responses.length > 0) {
                completed = true;
                const [first] = responses;
                completedAt = first.createdAt;
            }

            sentPrompt.completed = completed;
            sentPrompt.completedAt = completedAt;

            await AdminSentPromptService.getSharedInstance().save(sentPrompt);
            return {
                updated: true,
                isComplete: completed
            }
        } catch (error) {
            return {
                updated: false,
                error: `Failed to update prompt ${sentPrompt.id}: ${error.message}`
            }
        }
    }
}