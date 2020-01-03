import PromptContent, {ContentStatus} from "@shared/models/PromptContent";
import {isBlank} from "@shared/util/StringUtil";
import {CactusConfig} from "@shared/CactusConfig";
import chalk from "chalk";
import AdminFlamelinkService from "@admin/services/AdminFlamelinkService";

export class ScheduleResult {
    success: boolean = false;
    didPublish: boolean = false;
    errors: string[] = [];
    validInput = false;
    promptContent: PromptContent;

    constructor(promptContent: PromptContent) {
        this.promptContent = promptContent;
    }
}


export default class PromptContentScheduler {
    result: ScheduleResult
    promptContent: PromptContent;
    robotUserId: string;

    constructor(args: { promptContent: PromptContent, config: CactusConfig }) {
        this.promptContent = args.promptContent;
        this.robotUserId = args.config.flamelink.robot_user_id;
        this.result = new ScheduleResult(this.promptContent);
    }

    shouldProcess(): boolean {
        return this.promptContent.contentStatus === ContentStatus.submitted
    }

    /**
     *
     * @return {boolean} true if the input is valid
     */
    validateInput(): boolean {
        const promptContent = this.promptContent;
        this.result.validInput = true;
        if (promptContent.contentStatus !== ContentStatus.submitted) {
            this.result.validInput = false;
            this.result.errors.push(`The prompt content status must be '${ContentStatus.submitted}'. Not processing.`);
        }

        if (isBlank(promptContent.cactusElement)) {
            this.result.validInput = false;
            this.result.errors.push(`You must provide a 'cactusElement'`);
        }

        if (!promptContent.scheduledSendAt) {
            this.result.validInput = false;
            this.result.errors.push(`You must provide a '${PromptContent.Fields.scheduledSendAt}' value`);
        }

        return this.result.validInput;
    }

    async run(): Promise<ScheduleResult> {
        const promptContent = this.promptContent;
        const result = this.result;

        if (!this.shouldProcess()) {
            result.errors.push(`Will not process prompts with status of '${promptContent.contentStatus}'. To schedule a prompt it must be in the status of '${ContentStatus.submitted}'`);
            result.success = false;

            return result;
        }

        if (!this.validateInput()) {
            promptContent.contentStatus = ContentStatus.needs_changes;
            promptContent.errorMessage = result.errors.join(" | ");
            await this.savePrompt();
            return result;
        }

        promptContent.contentStatus = ContentStatus.published;
        await this.savePrompt();
        result.success = true;
        result.didPublish = true;


        return result;
    }

    async savePrompt(): Promise<void> {
        const promptContent = this.promptContent;
        AdminFlamelinkService.getSharedInstance().updateRaw(promptContent, {updatedBy: this.robotUserId});
        console.log(chalk.blue(`Saved PromptContent with status ${promptContent.contentStatus}`));
        return;
    }
}