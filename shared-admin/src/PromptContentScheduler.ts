import PromptContent, {ContentStatus} from "@shared/models/PromptContent";
import {isBlank} from "@shared/util/StringUtil";

export class ScheduleResult {
    success: boolean = false;
    errors: string[] = [];
    validInput = false;
}


export default class PromptContentScheduler {
    result: ScheduleResult = new ScheduleResult();
    promptContent: PromptContent;

    constructor(args: { promptContent: PromptContent }) {
        this.promptContent = args.promptContent;
    }

    /**
     *
     * @return {boolean} true if the input is valid
     */
    validateInput(): boolean {
        const promptContent = this.promptContent;
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
        // const promptContent = this.promptContent;
        const result = this.result;
        if (!this.validateInput()) {
            return result;
        }

        result.success = true;

        return result;
    }
}