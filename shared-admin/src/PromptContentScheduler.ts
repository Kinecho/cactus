import PromptContent, { ContentStatus, ContentType } from "@shared/models/PromptContent";
import { isBlank } from "@shared/util/StringUtil";
import { CactusConfig } from "@admin/CactusConfig";
import AdminFlamelinkService from "@admin/services/AdminFlamelinkService";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import AdminSlackService, {
    ChannelName,
    ChatMessage,
    SlackAttachment,
    SlackAttachmentField
} from "@admin/services/AdminSlackService";
import { buildPromptContentURL } from "@admin/util/StringUtil";
import { AmericaDenverTimezone, formatDateTime } from "@shared/util/DateUtil";
import ReflectionPrompt, { PromptType } from "@shared/models/ReflectionPrompt";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import { DateTime } from "luxon";
import { PageRoute } from "@shared/PageRoutes";
import Logger from "@shared/Logger";
import { stringifyJSON } from "@shared/util/ObjectUtil";

const logger = new Logger("PromptContentScheduler");

export class ScheduleResult {
    success: boolean = false;
    didPublish: boolean = false;
    existingPromptContentForDay: boolean = false;
    errors: string[] = [];
    validInput = false;
    promptContent: PromptContent;
    existingPromptContent?: PromptContent;
    reflectionPrompt?: ReflectionPrompt;
    existingReflectionPrompt = false;

    constructor(promptContent: PromptContent) {
        this.promptContent = promptContent;
    }
}


export default class PromptContentScheduler {
    result: ScheduleResult;
    promptContent: PromptContent;
    robotUserId: string;
    config: CactusConfig;

    constructor(args: { promptContent: PromptContent, config: CactusConfig }) {
        this.promptContent = args.promptContent;
        this.config = args.config;
        this.robotUserId = args.config.flamelink.robot_user_id;
        this.result = new ScheduleResult(this.promptContent);
    }

    hasValidContentStatus(): boolean {
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
            this.result.errors.push(`The prompt content status must be '${ ContentStatus.submitted }'. Not processing.`);
        }

        if (isBlank(promptContent.cactusElement)) {
            this.result.validInput = false;
            this.result.errors.push(`You must provide a 'cactusElement'`);
        }

        if (!promptContent.scheduledSendAt) {
            this.result.validInput = false;
            this.result.errors.push(`You must provide a '${ PromptContent.Fields.scheduledSendAt }' value`);
        }

        if (promptContent.content.length === 0) {
            this.result.validInput = false;
            this.result.errors.push("The list of content cards was empty. You must provide at least one content card.")
        }

        const reflectContent = promptContent.getQuestionContent();
        logger.info("The prompt reflection content is: ", reflectContent);

        if (!reflectContent) {
            logger.info("No reflection card found. Current content card types: " + promptContent.content?.map(r => r.contentType).join(", "));
            this.result.validInput = false;
            this.result.errors.push(`no reflect content card found. Please add a reflect screen.`);
        }

        const questionString = promptContent.getQuestion();
        if (isBlank(questionString)) {
            logger.info(`The prompt.getQuestion() method returned: ${ questionString }`);
            this.result.validInput = false;
            this.result.errors.push(`No question was found. Please add a \"${ ContentType.reflect }\" card with a value in the \"text\" field`)
        }

        return this.result.validInput;
    }

    async run(): Promise<ScheduleResult> {
        const result = this.result;
        const promptContent = this.promptContent;
        try {
            await this.processPromptContent();

            if (result.success) {
                logger.info("Saving prompt content with SUCCESS");
                promptContent.contentStatus = ContentStatus.published;
                promptContent.errorMessage = "";
                await this.savePromptContent();
                result.didPublish = true;
            } else {
                logger.warn("Saving prompt content with NEEDS_CHANGES", stringifyJSON(result.errors));
                promptContent.contentStatus = ContentStatus.needs_changes;
                promptContent.errorMessage = result.errors.join(" | ");
                await this.savePromptContent();
            }

        } catch (error) {
            result.success = false;
            result.didPublish = false;
            logger.error("Failed to process Prompt Content", error);
            result.errors.push(`An unexpected error occurred while processing the PromptContent. Please see the function logs for more information.  ${ error.message || error }`)
        }

        await this.notifySlack();
        return result;
    }

    async notifySlack() {
        const result = this.result;
        const message = result.success ? this.buildSuccessMessage(result) : this.buildErrorMessage(result);
        await AdminSlackService.getSharedInstance().sendMessage(ChannelName.content, message);
    }

    buildErrorMessage(result: ScheduleResult): ChatMessage {
        // const dateString = getISODate(this.promptContent.scheduledSendAt);
        const dateString = formatDateTime(this.promptContent.scheduledSendAt, {
            format: "cccc, LLLL d, yyyy",
            timezone: AmericaDenverTimezone
        });
        const fields: SlackAttachmentField[] = [
            { title: "Question", value: this.promptContent.getQuestion() || "not set" },
            { title: "Scheduled Send Date", value: dateString || "not set" },
            { title: "Prompt Content Entry ID", value: result.promptContent.entryId }
        ];

        if (result.existingPromptContent) {
            fields.push({ title: "Existing Prompt Content Entry ID", value: result.existingPromptContent.entryId })
        }

        if (result.promptContent.getQuestion()) {
            fields.push({ title: "Prompt Question", value: result.promptContent.getQuestion()! });
        }

        if (result.errors.length > 0) {
            fields.push({
                title: "Issues",
                value: "```" + result.errors.map(e => `- ${ e }`).join("\n") + "```",
            });
        }

        const attachments: SlackAttachment[] = [{
            text: " ",
            color: "warning",
            fields
        }];

        return {
            text: `There were problems while attempting to publish Prompt Content`,
            attachments
        };
    }

    buildSuccessMessage(result: ScheduleResult): ChatMessage {
        const link = buildPromptContentURL(this.promptContent, this.config);
        const dateString = formatDateTime(this.promptContent.scheduledSendAt, {
            format: "cccc, LLLL d, yyyy",
            timezone: AmericaDenverTimezone
        });
        const fields: SlackAttachmentField[] = [
            {
                title: "Send Date",
                value: dateString || "",
                short: false,
            },
            {
                title: "Question",
                value: this.promptContent.getQuestion() || "not set",
                short: false,
            },
            {
                title: "Prompt Entry ID",
                value: this.promptContent.entryId || "not set",
                short: true,
            },
            {
                title: "iOS Link (Custom Scheme)",
                short: true,
                value: `<${ this.config.ios.custom_scheme }://cactus.app${ PageRoute.PROMPTS_ROOT }/${ this.promptContent.entryId }|Open in iOS>`,
            },
            {
                title: "Web Link",
                value: `<${ link }|Open in Browser>`,
                short: true,
            }
        ];

        if (this.result.errors.length > 0) {
            fields.push({
                title: "Message",
                value: "```" + this.result.errors.map(e => `- ${ e }`).join("\n") + "```"
            });
        }

        return {
            text: `:white_check_mark: Successfully published prompt content for <${ link }|${ dateString }: ${ result.promptContent.getQuestion() }>`,
            attachments: [{
                color: "good",
                text: " ",
                fields,
            }]
        };
    }

    /**
     * Schedule the prompt content.
     * This will validate the fields on the PromptContent,
     * create/update the associated ReflectionPrompt
     *
     * This method does not save the final ContentStatus on the PromptContent - that is up to the calling code.
     *
     * @return {Promise<ScheduleResult>}
     */
    async processPromptContent(): Promise<ScheduleResult> {
        const promptContent = this.promptContent;
        const result = this.result;

        if (this.promptContent.contentStatus === ContentStatus.published) {
            result.errors.push("The prompt was already published. Not doing anything.");
            result.success = true;
            return result;
        }

        if (!this.hasValidContentStatus()) {
            result.errors.push(`Will not process prompts with status of '${ promptContent.contentStatus }'. To schedule a prompt it must be in the status of '${ ContentStatus.submitted }'`);
            result.success = false;

            return result;
        }

        logger.log("validating input...");
        if (!this.validateInput()) {
            return result;
        } else {
            promptContent.errorMessage = ""
        }

        logger.log("checking for existing scheduled prompt content...");
        const existingPrompt = await this.checkForExistingScheduledPromptContent();
        if (existingPrompt) {
            result.success = false;
            return result;
        }

        logger.log("Setting up reflection prompt...");
        const setupPromptSuccess = await this.setupReflectionPrompt();
        if (!setupPromptSuccess) {
            result.success = false;
            return result;
        }

        result.success = true;

        return result;
    }

    async setupReflectionPrompt(): Promise<boolean> {
        let prompt: ReflectionPrompt | undefined;
        const existingPrompt = await AdminReflectionPromptService.getSharedInstance().getPromptForPromptContentEntryId(this.promptContent.entryId);
        if (existingPrompt && existingPrompt.id) {
            prompt = existingPrompt;
            this.result.existingReflectionPrompt = true;
            this.result.reflectionPrompt = existingPrompt;
            //make sure the existing prompt matches any potentially existing prompt
            if (this.promptContent.promptId && this.promptContent.promptId !== existingPrompt.id) {
                logger.warn("The existing promptId on the promptContent doesn't match an existing ReflectionPrompt that has this promptContentId");
                this.result.errors.push(`The PromptContent's promptId does not match an existing ReflectionPrompt that had \"promptContentEntryId\" of ${ this.promptContent.entryId }`);
                this.result.success = false;
                return false;
            }
        } else {
            prompt = new ReflectionPrompt();
            prompt.createdAt = new Date();
            prompt.id = this.promptContent.entryId; //making the ids the same
            prompt.question = this.promptContent.getQuestion();
            prompt.topic = this.promptContent.topic;
            prompt.promptContentEntryId = this.promptContent.entryId;
            prompt.promptType = PromptType.CACTUS;
            prompt.shared = true;
            prompt.promptContentEntryId = this.promptContent.entryId
        }

        this.promptContent.promptId = prompt?.id;
        await Promise.all([
            AdminReflectionPromptService.getSharedInstance().save(prompt),
            this.savePromptContent()
        ]);

        logger.log(`Saved ReflectionPrompt to firestore and saved PromptContent to flamelink. PromptID = ${ prompt.id }`);
        return true;
    }

    async checkForExistingScheduledPromptContent(): Promise<PromptContent | undefined> {
        const scheduledDate = DateTime.fromJSDate(this.promptContent.scheduledSendAt!).toObject();
        const existingPromptTasks = this.promptContent.subscriptionTiers.map(tier => {
            return AdminPromptContentService.getSharedInstance().getPromptContentForDate({
                dateObject: scheduledDate,
                status: ContentStatus.published,
                subscriptionTier: tier
            });
        });

        const existingPrompts = await Promise.all(existingPromptTasks);

        const existingPrompt = existingPrompts.find(p => {
            return p && p.entryId !== this.promptContent.entryId
        });

        if (existingPrompt) {
            logger.warn("A prompt already exists for this date.");
            this.result.existingPromptContentForDay = true;
            this.result.existingPromptContent = existingPrompt;
            this.result.errors.push(`A promptContent entry (${ existingPrompt.entryId }) already exists for this tier on this date (${ scheduledDate.toLocaleString() })`)
            return existingPrompt;
        }

        return undefined; //only return the existing if it wasn't the current prompt;
    }

    async savePromptContent(): Promise<void> {
        const promptContent = this.promptContent;
        await AdminFlamelinkService.getSharedInstance().updateRaw(promptContent, { updatedBy: this.robotUserId });
        logger.log(`Saved PromptContent with status ${ promptContent.contentStatus }`);
        return;
    }
}