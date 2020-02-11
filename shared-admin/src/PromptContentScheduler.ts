import PromptContent, {ContentStatus, ContentType} from "@shared/models/PromptContent";
import {appendDomain, isBlank} from "@shared/util/StringUtil";
import {CactusConfig} from "@shared/CactusConfig";
import chalk from "chalk";
import AdminFlamelinkService from "@admin/services/AdminFlamelinkService";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import AdminSlackService, {
    ChannelName,
    ChatMessage,
    SlackAttachment,
    SlackAttachmentField
} from "@admin/services/AdminSlackService";
import {buildPromptContentURL} from "@admin/util/StringUtil";
import {formatDate, mailchimpTimeZone} from "@shared/util/DateUtil";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import {
    Campaign,
    CampaignType,
    SendChecklistItem,
    SendChecklistItemType
} from "@shared/mailchimp/models/MailchimpTypes";
import {
    CampaignContent,
    CampaignContentRequest,
    CampaignContentSectionMap,
    CreateCampaignRequest,
    CreateCampaignSettings,
    TemplateSection,
    UpdateCampaignRequest
} from "@shared/mailchimp/models/CreateCampaignRequest";
import MailchimpService from "@admin/services/MailchimpService";
import {SubscriptionTier} from "@shared/models/MemberSubscription";
import {DateTime} from "luxon";
import {AxiosError} from "axios";
import {PageRoute} from "@shared/PageRoutes";
import Logger from "@shared/Logger";

const logger = new Logger("PromptContentScheduler");

export interface ScheduleCampaignResult {
    success: boolean,
    error?: string,
    warnings?: SendChecklistItem[]
}

export interface EmailResult {
    success: boolean,
    alreadyScheduled?: boolean,
    campaign?: Campaign,
    error?: string | undefined,
    scheduled: boolean,
}

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
    mailchimpCampaign?: Campaign | undefined;
    scheduledEmails = false;

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

        if (promptContent.content.length === 0) {
            this.result.validInput = false;
            this.result.errors.push("The list of content cards was empty. You must provide at least one content card.")
        }

        if (isBlank(promptContent.getQuestion())) {
            this.result.validInput = false;
            this.result.errors.push(`No question was found. Please add a \"${ContentType.reflect}\" card with a value in the \"text\" field`)
        }

        return this.result.validInput;
    }

    async run(): Promise<ScheduleResult> {
        const result = this.result;
        const promptContent = this.promptContent;
        try {
            await this.processPromptContent();

            if (result.success) {
                promptContent.contentStatus = ContentStatus.published;
                promptContent.errorMessage = "";
                await this.savePromptContent();
                result.didPublish = true;
            } else {
                promptContent.contentStatus = ContentStatus.needs_changes;
                promptContent.errorMessage = result.errors.join(" | ");
                await this.savePromptContent();
            }

        } catch (error) {
            result.success = false;
            result.didPublish = false;
            logger.error("Failed to process Prompt Content", error);
            result.errors.push(`An unexpected error occurred while processing the PromptContent. Please see the function logs for more information.  ${error.message || error}`)
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
        const dateString = formatDate(this.promptContent.scheduledSendAt, "cccc, LLLL d, yyyy");
        const fields: SlackAttachmentField[] = [
            {title: "Question", value: this.promptContent.getQuestion() || "not set"},
            {title: "Scheduled Send Date", value: dateString || "not set"},
            {title: "Prompt Content Entry ID", value: result.promptContent.entryId!}
        ];

        if (result.existingPromptContent) {
            fields.push({title: "Existing Prompt Content Entry ID", value: result.existingPromptContent.entryId!})
        }

        if (result.promptContent.getQuestion()) {
            fields.push({title: "Prompt Question", value: result.promptContent.getQuestion()!});
        }

        if (result.mailchimpCampaign?.web_id) {
            fields.push({
                title: "Mailchimp",
                value: `<https://us20.admin.mailchimp.com/campaigns/edit?id=${result.mailchimpCampaign.web_id}|Edit Campaign>`
            })
        }

        if (result.errors.length > 0) {
            fields.push({
                title: "Issues",
                value: "```" + result.errors.map(e => `- ${e}`).join("\n") + "```",
            });
        }

        const attachments: SlackAttachment[] = [{
            // title: "Issues",
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
        // const dateString = getISODate(this.promptContent.scheduledSendAt);
        const dateString = formatDate(this.promptContent.scheduledSendAt, "cccc, LLLL d, yyyy");
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
                value: `<${this.config.ios.custom_scheme}://cactus.app${PageRoute.PROMPTS_ROOT}/${this.promptContent.entryId!}|Open in iOS>`,
            },
            {
                title: "Web Link",
                value: `<${link}|Open in Browser>`,
                short: true,
            }
        ];
        if (this.result.mailchimpCampaign?.archive_url) {
            fields.push({
                title: "Mailchimp Email",
                value: `<${this.result.mailchimpCampaign.archive_url}|View Email>`,
                short: true,
            })
        }

        if (this.result.errors.length > 0) {
            fields.push({title: "Message", value: "```" + this.result.errors.map(e => `- ${e}`).join("\n") + "```"});
        }

        return {
            text: `:white_check_mark: Successfully published prompt content for <${link}|${dateString}: ${result.promptContent.getQuestion()}>`,
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
     * create/update the associated ReflectionPrompt, and schedule/update mailchimp emails
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
            result.errors.push(`Will not process prompts with status of '${promptContent.contentStatus}'. To schedule a prompt it must be in the status of '${ContentStatus.submitted}'`);
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

        logger.log("setting up emails...");
        const emailResult = await this.setupEmails();
        logger.log("Set up email response", JSON.stringify(emailResult));
        if (!emailResult.success) {
            logger.error("Failed to setup emails", emailResult.error);
            result.success = false;
            return result;
        } else {
            result.success = true;
        }

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
                this.result.errors.push(`The PromptContent's promptId does not match an existing ReflectionPrompt that had \"promptContentEntryId\" of ${this.promptContent.entryId}`);
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
        }

        this.promptContent.promptId = prompt?.id;
        await Promise.all([
            AdminReflectionPromptService.getSharedInstance().save(prompt),
            this.savePromptContent()
        ]);

        logger.log(chalk.green(`Saved ReflectionPrompt to firestore and saved PromptContent to flamelink. PromptID = ${prompt.id}`));
        return true;
    }

    async checkForExistingScheduledPromptContent(): Promise<PromptContent | undefined> {
        const scheduledDate = DateTime.fromJSDate(this.promptContent.scheduledSendAt!).toObject();
        const existingPrompt = await AdminPromptContentService.getSharedInstance().getPromptContentForDate({
            dateObject: scheduledDate,
            status: ContentStatus.published
        });
        if (existingPrompt && existingPrompt.entryId !== this.promptContent.entryId) {
            logger.warn("A prompt already exists for this date.");
            this.result.existingPromptContentForDay = true;
            this.result.existingPromptContent = existingPrompt;
            this.result.errors.push(`A promptContent entry (${existingPrompt.entryId}) already exists for this date (${scheduledDate.toLocaleString()})`)
            return existingPrompt
        }
        return undefined; //only return the existing if it wasn't the current prompt;
    }

    async setupEmails(): Promise<EmailResult> {
        const {success, error, campaign} = await this.createMailchimpCampaign();

        if (!success || !campaign) {
            this.result.success = false;
            logger.error(chalk.red("Failed to create/get campaign"), error);
            if (error) {
                this.result.errors.push(error);
            }
            return {
                success,
                campaign,
                error,
                scheduled: false,
                alreadyScheduled: false,
            }
        }

        this.result.mailchimpCampaign = campaign;
        this.promptContent.mailchimpCampaignId = campaign.id;
        this.promptContent.mailchimpCampaignWebId = campaign.web_id;

        logger.log("Got campaign, updating the campaign content");
        const contentResponse = await this.updateCampaignContent(campaign);

        logger.log("updated campaign content, now scheduling the campaign");
        const scheduleResult = await this.scheduleCampaign(campaign);
        logger.log("schedlue campaign result", JSON.stringify(scheduleResult));
        return {
            success: success && scheduleResult.success && contentResponse.success,
            campaign,
            error,
            scheduled: scheduleResult.success,
            alreadyScheduled: false,
        }
    }

    async scheduleCampaign(campaign: Campaign): Promise<ScheduleCampaignResult> {
        const campaignChecklist = await MailchimpService.getSharedInstance().getCampaignSendChecklist(campaign.id);
        const result: ScheduleCampaignResult = {success: false};
        const isReady = campaignChecklist.is_ready;
        // let didForceRetry = false;

        if (!isReady) {
            logger.error("The campaign is not ready to be scheduled.");
            const issues = campaignChecklist.items.filter(item => item.type !== SendChecklistItemType.success && item.heading !== "MonkeyRewards");
            return {
                success: false,
                error: "The campaign is not ready to be sent. In the old days, this would happen for reminder emails and we'd use a \"trick\" to force them to be scheduled. If we start to schedule reminder emails again, we'll need to revisit this code.",
                warnings: issues
            }
        }

        const warnings = campaignChecklist.items.filter(item => item.type === SendChecklistItemType.warning && item.heading !== "MonkeyRewards");
        logger.log(chalk.green(`Campaign is ready to be scheduled`));
        if (warnings.length > 0) {
            logger.warn(chalk.yellow(`The mailchimp campaign is ready to send, however, there are ${warnings.length} warnings. \n${JSON.stringify(warnings, null, 2)}`));
            result.warnings = warnings;
        }

        const scheduledDate = new Date(this.promptContent.scheduledSendAt!);

        const send_time = DateTime.fromJSDate(scheduledDate).setZone(mailchimpTimeZone)
            .set({
                hour: 2,
                minute: 45
            }).toISO();
        logger.log("Scheduling Mailchimp campaign for promptContent scheduled Date", scheduledDate);
        logger.log("The scheduled date is converted into ISO string for mailchimp at 2:45am: ", send_time);

        let scheduleResponse = await MailchimpService.getSharedInstance().scheduleCampaign(campaign.id, {schedule_time: send_time}, campaign.web_id);
        logger.log("schedule campaign success:", scheduleResponse);

        if (scheduleResponse.alreadyScheduled) {
            logger.log("Attempting to unschedule the campaign so we can reschedule it.");
            const unscheduleResponse = await MailchimpService.getSharedInstance().unscheduleCampaign(campaign);
            if (unscheduleResponse.success) {
                logger.log("Un-scheduling campaign was successful. attempting to re-schedule campaign");
                scheduleResponse = await MailchimpService.getSharedInstance().scheduleCampaign(campaign.id, {schedule_time: send_time}, campaign.web_id);
                logger.log("re-schedule campaign response: ", JSON.stringify(scheduleResponse))
            } else {
                logger.error("Unschedule campaign failed", unscheduleResponse.errorMessage);
                result.error = unscheduleResponse.errorMessage;
                result.success = false;
                this.result.errors.push(`The campaign was already scheduled and failed to re-schedule: ${unscheduleResponse.errorMessage}`);
                return result;
            }
        }

        if (!scheduleResponse.success && !scheduleResponse.alreadyScheduled) {
            result.error = scheduleResponse.error || "Unable to schedule the campaign. An API error occurred but it's not clear what it was."
            logger.error("Failed to schedule the campaign", scheduleResponse.error);
            result.success = false;
            this.result.errors.push(result.error!);
        }
        result.success = scheduleResponse.success;
        return result;
    }

    createReflectButtonHtml(): string {
        const path = `${PageRoute.PROMPTS_ROOT}/${this.promptContent.entryId!}`;
        const domain = this.config.web.domain;
        const linkText = "Reflect";
        return `<a class="button" href="${appendDomain(path, domain)}?e=*|URL:EMAIL|*">${linkText}</a>`
    }

    async updateCampaignContent(campaign: Campaign): Promise<{ success: boolean, content?: CampaignContent, error?: string }> {
        logger.log(chalk.bold("creating template content..."));
        const sections: CampaignContentSectionMap = {
            [TemplateSection.question]: this.promptContent.getQuestion()!,
            [TemplateSection.inspiration]: this.promptContent.getPreviewText() || "",
            [TemplateSection.content_link]: this.createReflectButtonHtml(),
        };


        if (this.promptContent.topic) {
            sections[TemplateSection.prompt_topic] = this.promptContent.topic || "";
        }

        const contentRequest: CampaignContentRequest = {
            template: {
                id: Number(this.config.mailchimp.templates.prompt_module_morning),
                sections
            }
        };
        try {
            const campaignContent = await MailchimpService.getSharedInstance().updateCampaignContent(campaign.id, contentRequest);
            logger.log("Successfully updated the template content for campaign\n");

            return {success: !!campaignContent, content: campaignContent}
        } catch (error) {
            const message = error.isAxiosError && (error as AxiosError).response?.data || "Unable to create campaign content";
            this.result.errors.push(message);
            return {
                success: false,
                error: message
            }
        }
    }

    async createMailchimpCampaign(): Promise<{ success: boolean, campaign?: Campaign, error?: string }> {
        logger.log("Setting up the mailchimp campaign");

        const config = this.config.mailchimp;
        const promptContent = this.promptContent;
        const sendDate = formatDate(promptContent.scheduledSendAt);
        logger.log(chalk.red(`Mailchimp Send Date is formatted as: ${sendDate}`));
        const campaignTitle = `${sendDate} - Daily - ${promptContent.getQuestion()}`;

        const prompt = this.result.reflectionPrompt;
        const campaignSettings: CreateCampaignSettings = {
            title: campaignTitle,
            reply_to: "hello@cactus.app",
            subject_line: promptContent.subjectLine,
            from_name: "Cactus",
            preview_text: promptContent.getPreviewText(),
            to_name: '*|FNAME|* *|LNAME|*'
        };

        const segmentId = this.mailchimpSegmentId();

        if (prompt?.campaign?.id) {
            logger.log("The campaign already exists on the ReflectionPrompt so we will update it");

            const updateRequest: UpdateCampaignRequest = {
                settings: campaignSettings,
                recipients: {
                    list_id: config.audience_id,
                    segment_opts: {
                        saved_segment_id: Number(segmentId),
                    }
                },
            };

            try {
                await MailchimpService.getSharedInstance().updateCampaign(prompt.campaign.id, updateRequest);
                return {success: true, campaign: prompt.campaign};
            } catch (updateError) {
                logger.error("Update campaign failed.", updateError);
                return {
                    success: false,
                    campaign: prompt.campaign,
                    error: `${JSON.stringify(updateError.response?.data || updateError)}`
                };
            }
        }

        // the campaign does not already exist so we will create it
        const campaignRequest: CreateCampaignRequest = {
            type: CampaignType.regular,
            recipients: {
                list_id: config.audience_id,
                segment_opts: {
                    saved_segment_id: Number(segmentId),
                }
            },
            settings: campaignSettings,
            tracking: {
                html_clicks: false,
                text_clicks: false
            }
        };

        try {
            const campaign = await MailchimpService.getSharedInstance().createCampaign(campaignRequest);

            if (prompt) {
                prompt.campaign = campaign;
                await AdminReflectionPromptService.getSharedInstance().save(prompt)
            }

            return {campaign, success: true};
        } catch (error) {
            if (error.isAxiosError) {
                const axiosError = error as AxiosError;
                logger.error("API Error creating mailchimp campaign", axiosError.response?.data);
                return {
                    success: false,
                    error: JSON.stringify(axiosError.response?.data) || "API call failed to create mailchimp campaign "
                }
            } else {
                logger.error("Failed to create mailchimp campaign", error);
                return {
                    success: false,
                    error: `API Call to mailchimp to create the campaign failed: ${error.message ? error.message : error}`
                };
            }

        }
    }

    async savePromptContent(): Promise<void> {
        const promptContent = this.promptContent;
        await AdminFlamelinkService.getSharedInstance().updateRaw(promptContent, {updatedBy: this.robotUserId});
        logger.log(chalk.blue(`Saved PromptContent with status ${promptContent.contentStatus}`));
        return;
    }

    mailchimpSegmentId(): string {
        if (this.promptContent?.subscriptionTiers?.includes(SubscriptionTier.BASIC)) {
            return this.config.mailchimp.segment_id_all_tiers;
        } else {
            return this.config.mailchimp.segment_id_plus_tier;
        }
    }
}