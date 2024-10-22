import * as chalk from "chalk";
import {getCactusConfig, Project} from "@scripts/config";
import MailchimpService from "@admin/services/MailchimpService";
import {
    CampaignContentRequest,
    CampaignContent,
    CampaignTracking,
    CreateCampaignRequest,
    CreateCampaignRequestRecipients,
    SegmentCondition, SegmentConditionOption,
    SegmentConditionType,
    SegmentField,
    SegmentMatchType,
    SegmentOperator,
    TemplateSection,
    UpdateCampaignRequest, CampaignContentSectionMap
} from "@shared/mailchimp/models/CreateCampaignRequest";
import {
    Campaign,
    CampaignType, ISODate,
    MergeField,
    SendChecklistItemType,
    TemplateType
} from "@shared/mailchimp/models/MailchimpTypes";
import {getUrlFromInput, isValidEmail, appendDomain} from "@shared/util/StringUtil";
import {CactusConfig} from "@admin/CactusConfig";
import {AmericaDenverTimezone, makeUTCDateIntoMailchimpDate} from "@shared/util/DateUtil";
import {DateTime} from "luxon";
import {Command} from "@scripts/CommandTypes";

export const DEFAULT_MORNING_TEMPLATE_ID = 53353;
export const DEFAULT_REMINDER_TEMPLATE_ID = 53981;

export const TOPIC_MORNING_TEMPLATE_ID = 59013;
export const TOPIC_REMINDER_TEMPLATE_ID = 59169;

export const PROMPT_MODULE_TEMPLATE_ID = 84565;
export const PROMPT_MODULE_REMINDER_TEMPLATE_ID = 59169;

const prompts = require('prompts');

interface ContentQuestionResponse {
    question: string;
    contentPath: string;
    contentLinkText: string;
    inspirationText?: string;
    subjectLine: string;
    previewText: string;
    replyTo: string;
    fromName: string;
    sendDateISO: string;
    campaignTitle: string;
    promptContentId: string;
}

interface UseDefaultConfigurationResponse {
    useDefault: boolean;
}

export interface RecipientsConfiguration {
    audienceId: string,
    useSavedSegment: boolean;
    savedSegmentId?: number;
    useTags: boolean;
    tagSegmentIds: number[];
    environment: Project;
    useTemplate: boolean;
    templateId?: number;
    segmentMatchType: SegmentMatchType;
    useAutomations: boolean;
    automationIds: string[];
    automationOperator: SegmentOperator;
}

interface ReminderConfiguration {
    scheduleReminder: boolean;
    fromName: string;
    replyTo: string;
    previewText: string;
    subjectLine: string;
    sendDateISO: string;
    useDefaultTemplate: boolean;
    useTemplate: boolean;
    templateId?: number;
    campaignTitle: string;
    suppressInactive: boolean;
    inactiveDaysThreshold?: number;
    promptContentId: string;
}

export enum QuestionType {
    DEFAULT,
    TOPIC,
    PROMPT,
}

export default class MailchimpQuestionCampaign implements Command {
    name = "Mailchimp Email Campaign";
    description = "Create a mailchimp email campaign + reeminder";
    showInList = false;

    question?: string;
    contentPath?: string;
    promptContentId?: string;
    questionType: QuestionType = QuestionType.DEFAULT;
    campaign?: Campaign;
    reminderCampaign?: Campaign;

    campaignContent?: CampaignContent;
    reminderContentResponse?: CampaignContent;

    project?: Project;
    currentConfig?: CactusConfig;
    stageConfig?: CactusConfig;
    prodConfig?: CactusConfig;
    mailchimpService?: MailchimpService;

    reflectionPromptId?: string;
    topic?: string;
    introText?: string;

    scheduleDateISO?: ISODate;

    async start(): Promise<void> {
        console.log(chalk.bold.cyan("Let's create a mailchimp campaign for a daily question"));
        console.log(chalk.cyan("This program will walk you through creating the campaign. \n" +
            "You'll have the chance to review the settings before creating it in Mailchimp. \n" +
            "Once a campaign is created, it will be in a draft status, so you can always edit/delete it before it starts sending.\n"));

        const [prodConfig, stageConfig] = await Promise.all([getCactusConfig(Project.PROD), getCactusConfig(Project.STAGE)]);
        this.prodConfig = prodConfig;
        this.stageConfig = stageConfig;

        if (!this.project) {
            const {environment} = await this.askEnvironmentQuestion();
            this.project = environment;
        } else {
            console.log("environment has been set to " + this.project);
        }

        if (this.project === Project.PROD) {
            this.currentConfig = prodConfig;
        } else {
            this.currentConfig = stageConfig;
        }
        this.mailchimpService = new MailchimpService(this.currentConfig.mailchimp.api_key, this.currentConfig.mailchimp.audience_id);

        const contentResponse = await this.askContentQuestions();
        const defaultConfigurationResponse = await this.askUseDefaultsQuestion();

        let recipientsConfig;
        if (defaultConfigurationResponse.useDefault) {
            console.log(`Great! Using the default configuration for ${this.project}`);
            recipientsConfig = await this.getDefaultRecipientConfiguration(this.project, {
                prod: prodConfig,
                stage: stageConfig
            });
        } else {
            //need to set up the content response
            recipientsConfig = await this.askRecipientQuestions();
        }

        const {campaign, content} = await this.createCampaign(contentResponse, recipientsConfig);
        this.campaign = campaign;
        this.campaignContent = content;
        this.scheduleDateISO = contentResponse.sendDateISO;

        const reminderConfig = await this.askReminderQuestions(contentResponse);
        if (reminderConfig.scheduleReminder) {
            const reminderResponse = await this.createReminderCampaign(contentResponse, recipientsConfig, reminderConfig);
            this.reminderCampaign = reminderResponse.campaign;
            this.reminderContentResponse = reminderResponse.content;
        }

        const {scheduleNow} = await prompts({
            type: "confirm",
            name: "scheduleNow",
            message: `Would you like to schedule your campaigns now (say no to leave them in draft status)?`
        });

        if (scheduleNow) {
            if (this.campaign) {
                await this.scheduleCampaign(this.campaign, contentResponse.sendDateISO, false);
            }

            if (this.reminderCampaign) {
                await this.scheduleCampaign(this.reminderCampaign, reminderConfig.sendDateISO, true);
            }

        } else {
            console.log(chalk.blue("Not scheduling the emails. They will remain in draft status."));
        }


        console.log(chalk.green("\n\n======================================================"));
        if (this.campaign) {
            console.log(`Created Daily campaign "${chalk.bold(this.campaign.settings.title)}"\nid = ${this.campaign.id}\nCampaign URL: https://us20.admin.mailchimp.com/campaigns/edit?id=${this.campaign.web_id}\n`)
        } else {
            console.log(chalk.red("Unable to create the daily campaign"));
        }

        if (this.reminderCampaign) {
            // await this.scheduleCampaign(this.reminderCampaign, reminderConfig.sendDateISO, true);
            console.log(`Created Reminder campaign "${chalk.bold(this.reminderCampaign.settings.title)}"\nid = ${this.reminderCampaign.id})\nCampaign URL: https://us20.admin.mailchimp.com/campaigns/edit?id=${this.reminderCampaign.web_id}`)
        } else {
            console.log(chalk.red("Unable to create the reminder campaign"));
        }
        console.log(chalk.green("======================================================"));

        return;
    }

    async askContentQuestions(): Promise<ContentQuestionResponse> {
        const contentQuestions = [
            {
                type: "text",
                name: "question",
                message: "What is the question?",
                initial: this.question || "",
            },
            {
                type: this.questionType === QuestionType.DEFAULT ? "text" : null,
                name: "contentPath",
                message: "Reflect page content path",
                initial: () => getUrlFromInput(this.contentPath),
                format: (value: string) => getUrlFromInput(value)
            },
            {
                type: this.questionType === QuestionType.PROMPT ? "text" : null,
                name: "contentPath",
                message: "Prompt module path",
                initial: () => `prompts/${this.promptContentId}`,
                format: (value: string) => `${value}`
            },
            {
                type: [QuestionType.DEFAULT, QuestionType.PROMPT].includes(this.questionType) ? "text" : null,
                name: "contentLinkText",
                message: "Content link text",
                initial: "Reflect"
            },
            {
                type: "text",
                name: "inspirationText",
                message: "Inspiration text (optional)",
                initial: this.introText
            },
            {
                type: "text",
                name: "subjectLine",
                message: "Subject Line",
                initial: (prev: string, values: ContentQuestionResponse) => values.question,
            },
            {
                type: "text",
                name: "previewText",
                message: "Preview Text",
                initial: (prev: string, values: ContentQuestionResponse) => this.introText,
            },
            {
                type: "text",
                name: "fromName",
                message: "From Name",
                initial: "Cactus",
            },
            {
                type: "text",
                name: "replyTo",
                message: "reply-to email address",
                initial: `hello@cactus.app`,
                validate: (value: string) => isValidEmail(value) && value.endsWith("cactus.app") ? true : 'Please enter a valid email that ends in \"cactus.app\"'
            },
            {
                type: "date",
                name: "sendDateISO",
                message: "When should this email be sent?",
                mask: `dddd YYYY-MM-DD "at" h:mm A "Mountain Time"`,
                initial: DateTime.local().plus({day: 1}).set({
                    hour: 2,
                    minute: 45,
                    second: 0,
                    millisecond: 0
                }).toJSDate(),
                validate: (date: Date) => {
                    if (date.getTime() <= Date.now()) {
                        return 'The date must be in the future';
                    }
                    if (![0, 15, 30, 45].includes(date.getMinutes())) {
                        return 'The schedule time must be on the quarter hour, :00, :15, :30, or :45'
                    }

                    return true;
                },
                format: (value: Date) => makeUTCDateIntoMailchimpDate(value, true, AmericaDenverTimezone)
            },
            {
                type: "text",
                name: "campaignTitle",
                message: "Campaign Title",
                initial: (prev: string, values: ContentQuestionResponse) => {
                    const shortFormat = DateTime.fromISO(values.sendDateISO).toISODate();
                    return `${shortFormat} - Daily - ${values.subjectLine}`
                },
            },

        ];

        return await prompts(contentQuestions, {
            onCancel: (prompt: any) => {
                console.log("Canceled command on prompt", prompt.message);
                return process.exit(0);
            }
        });

    }

    async createReminderCampaign(originalContentResponse: ContentQuestionResponse,
                                 recipientsConfig: RecipientsConfiguration,
                                 reminderConfig: ReminderConfiguration): Promise<{ campaign?: Campaign, content?: CampaignContent }> {

        if (!this.campaign) {
            throw new Error("Can't create a reminder because no original campaign can be found");
        }

        const mailchimpService = this.mailchimpService;
        if (!mailchimpService) {
            throw new Error("No mailchimp service was available - unable to save campaign");
        }

        const campaignWebId = this.campaign.web_id;

        const campaignRecipients: CreateCampaignRequestRecipients = {
            list_id: recipientsConfig.audienceId,
            segment_opts: {
                match: SegmentMatchType.all,
                conditions: [
                    {
                        condition_type: SegmentConditionType.DateMerge,
                        field: MergeField.LAST_REPLY,
                        op: SegmentOperator.less,
                        value: DateTime.fromISO(originalContentResponse.sendDateISO).toISODate()
                    },
                    {
                        condition_type: SegmentConditionType.Aim,
                        field: SegmentField.aim,
                        op: SegmentOperator.sent,
                        value: campaignWebId
                    }
                ],
            }
        };


        if (reminderConfig.suppressInactive && reminderConfig.inactiveDaysThreshold && reminderConfig.inactiveDaysThreshold > 0) {
            const suppressionDateISO = DateTime.fromISO(originalContentResponse.sendDateISO).minus({days: reminderConfig.inactiveDaysThreshold}).toISODate()
            console.log(`Suppressing reminders if people haven't responded since ${suppressionDateISO}`);

            const opts = campaignRecipients.segment_opts as SegmentConditionOption;
            opts.conditions.push({
                condition_type: SegmentConditionType.DateMerge,
                field: MergeField.LAST_REPLY,
                op: SegmentOperator.greater,
                value: DateTime.fromISO(suppressionDateISO).toISODate()
            },)
        }

        const campaignTracking: CampaignTracking = {
            html_clicks: false,
            text_clicks: false
        };

        const campaignRequest: CreateCampaignRequest = {
            type: CampaignType.regular,
            recipients: campaignRecipients,
            settings: {
                title: reminderConfig.campaignTitle,
                reply_to: reminderConfig.replyTo,
                subject_line: reminderConfig.subjectLine,
                from_name: reminderConfig.fromName,
                preview_text: reminderConfig.previewText,
                to_name: '*|FNAME|* *|LNAME|*'
            },
            tracking: campaignTracking
        };

        const confirmResponses = await prompts([{
            type: "toggle",
            message: "Ready to save the reminder campaign to Mailchimp?",
            name: "confirm",
            active: 'yes',
            inactive: 'no',
            initial: true,
        }]);

        if (!confirmResponses.confirm) {
            console.log(chalk.bold.red("Not creating reminder campaign. Exiting"));
            return {};
        }

        /*
         * This will create the campaign
         */
        const reminderCampaign = await mailchimpService.createCampaign(campaignRequest);

        let campaignContent;
        if (reminderConfig.useTemplate && reminderConfig.templateId || reminderConfig.useDefaultTemplate) {
            campaignContent = await this.createCampaignContent(reminderCampaign.id,
                reminderConfig.templateId || this.getDefaultReminderTemplateId(),
                originalContentResponse);
        }

        return {campaign: reminderCampaign, content: campaignContent};
    }

    async createCampaignContent(campaignId: string, templateId: number, contentResponse: ContentQuestionResponse): Promise<CampaignContent | undefined> {
        const mailchimpService = this.mailchimpService;
        if (!mailchimpService) {
            throw new Error("No mailchimp service was available - unable to save campaign");
        }

        const config = this.currentConfig;
        let domain = 'cactus.app';
        if (config) {
            domain = config.dynamic_links.domain;
        }

        let campaignContent;

        console.log(chalk.bold("creating template content..."));
        const sections: CampaignContentSectionMap = {
            [TemplateSection.question]: contentResponse.question,
            [TemplateSection.content_link]: contentResponse.contentPath ? `<a class="button" href="${appendDomain(contentResponse.contentPath, domain)}?e=*|URL:EMAIL|*">${contentResponse.contentLinkText}</a>` : "",
            [TemplateSection.inspiration]: contentResponse.inspirationText || "",
        };

        if (this.reflectionPromptId) {
            sections[TemplateSection.reflectionPromptId] = this.reflectionPromptId || "";
        }

        if (this.topic) {
            sections[TemplateSection.prompt_topic] = this.topic || "";
        }

        const contentRequest: CampaignContentRequest = {
            template: {
                id: templateId,
                sections
            }
        };
        campaignContent = await mailchimpService.updateCampaignContent(campaignId, contentRequest);
        console.log("Successfully updated the template content for campaign\n");

        return campaignContent
    }

    async askReminderQuestions(contentConfig: ContentQuestionResponse): Promise<ReminderConfiguration> {
        const mailchimpService = this.mailchimpService;
        if (!mailchimpService) {
            throw new Error("No mailchimp service was available - unable to save campaign");
        }


        return await prompts([
            {
                type: "toggle",
                name: "scheduleReminder",
                message: "Do you want to create the reminder email now?",
                initial: false,
                active: 'yes',
                inactive: 'no',
            },
            {
                type: "text",
                name: "campaignTitle",
                message: "Campaign Title",
                initial: async () => {
                    const shortFormat = DateTime.fromISO(contentConfig.sendDateISO).toISODate();
                    return `${shortFormat} - Reminder - ${contentConfig.subjectLine}`
                },
            },
            {
                type: "text",
                name: "subjectLine",
                message: "Subject Line",
                initial: `*|DATE:l|* Reflection Reminder: ${contentConfig.subjectLine}`,
            },
            {
                type: "text",
                name: "replyTo",
                message: "From Email",
                initial: contentConfig.replyTo,
            },
            {
                type: "text",
                name: "fromName",
                message: "From Name",
                initial: contentConfig.fromName,
            },
            {
                type: "text",
                name: "previewText",
                message: "Preview Text",
                initial: contentConfig.previewText,
            },
            {
                type: "date",
                name: "sendDateISO",
                message: `When should this reminder email be sent (morning email is set to ${DateTime.fromISO(contentConfig.sendDateISO).toFormat("cccc yyyy-LL-dd 'at' h:mm a")})?`,
                mask: `dddd YYYY-MM-DD "at" h:mm A "Mountain Time"`,
                initial: DateTime.fromISO(contentConfig.sendDateISO).set({hour: 17, minute: 0, second: 0}).toJSDate(),
                validate: (date: Date) => {
                    if (date.getTime() <= Date.now()) {
                        return 'The date must be in the future';
                    }
                    if (![0, 15, 30, 45].includes(date.getMinutes())) {
                        return 'The schedule time must be on the quarter hour, :00, :15, :30, or :45'
                    }

                    return true;
                },
                format: (value: Date) => makeUTCDateIntoMailchimpDate(value, true, AmericaDenverTimezone)
            },
            {
                type: "toggle",
                name: "suppressInactive",
                message: "Suppress reminders for inactive users?",
                initial: true,
                active: 'yes',
                inactive: 'no'
            },
            {
                type: (prev: boolean, values: ReminderConfiguration) => values.suppressInactive ? "number" : null,
                name: "inactiveDaysThreshold",
                message: "How many days of inactivity should we suppress?",
                initial: 7,
                min: 1,
                max: 100,
                validate: (value: number) => {
                    return value > 0 ? true : "Please choose a number greater than 0";
                }
            },
            {
                type: "toggle",
                name: "useDefaultTemplate",
                message: "Use the default reminder template?",
                initial: true,
                active: "yes",
                inactive: "no"
            },
            {
                type: (prev: boolean, values: ReminderConfiguration) => values.useDefaultTemplate ? null : "toggle",
                name: "useTemplate",
                message: "Use a template for the email?",
                initial: true,
                active: 'yes',
                inactive: 'no',
            },
            {
                type: (prev: boolean, values: ReminderConfiguration) => (values.useTemplate && !values.useDefaultTemplate) ? "select" : null,
                name: "templateId",
                max: 1,
                message: "Choose a template for the reminder email",
                choices: async (prev: boolean, values: RecipientsConfiguration) => {
                    if (!values.useTemplate) {
                        return []
                    }
                    const templates = await mailchimpService.getAllTemplates(TemplateType.user);
                    return templates.map(template => ({
                        title: template.name,
                        value: template.id,
                        selected: DEFAULT_REMINDER_TEMPLATE_ID === template.id
                    }))
                },
                format: (value: string) => Number(value),
            },

        ], {
            onSubmit: (prompt: any, response: any, answers: ReminderConfiguration) => {
                if (!answers.scheduleReminder) {
                    console.log("not scheduling reminders");
                    return true;
                }
                return false;
            },
            onCancel: (prompt: any) => {
                console.log("Canceled command on prompt", prompt.message);

                return process.exit(0);
            }
        });
    }

    async createCampaign(contentResponse: ContentQuestionResponse, recipientsConfig: RecipientsConfiguration): Promise<{ campaign?: Campaign, content?: CampaignContent }> {
        const mailchimpService = this.mailchimpService;
        if (!mailchimpService) {
            throw new Error("No mailchimp service was available - unable to save campaign");
        }

        const campaignRecipients: CreateCampaignRequestRecipients = {
            list_id: recipientsConfig.audienceId,
        };

        if (recipientsConfig.savedSegmentId) {
            campaignRecipients.segment_opts = {
                saved_segment_id: recipientsConfig.savedSegmentId,
            }
        } else {
            const conditions: SegmentCondition[] = [];
            if (recipientsConfig.useTags && recipientsConfig.tagSegmentIds && recipientsConfig.tagSegmentIds.length > 0) {
                recipientsConfig.tagSegmentIds.forEach(segmentId => {
                    conditions.push({
                        op: SegmentOperator.static_is,
                        field: SegmentField.static_segment,
                        condition_type: SegmentConditionType.StaticSegment,
                        value: segmentId,
                    })
                })
            }

            if (recipientsConfig.useAutomations && recipientsConfig.automationIds && recipientsConfig.automationIds.length > 0) {
                recipientsConfig.automationIds.forEach(automationId => {
                    conditions.push({
                        op: recipientsConfig.automationOperator,
                        field: SegmentField.static_segment,
                        condition_type: SegmentConditionType.StaticSegment,
                        value: automationId,
                    })
                })
            }

            campaignRecipients.segment_opts = {
                match: recipientsConfig.segmentMatchType,
                conditions,
            }
        }

        const campaignTracking: CampaignTracking = {
            html_clicks: false,
            text_clicks: false
        };

        const campaignRequest: CreateCampaignRequest = {
            type: CampaignType.regular,
            recipients: campaignRecipients,
            settings: {
                title: contentResponse.campaignTitle,
                reply_to: contentResponse.replyTo,
                subject_line: contentResponse.subjectLine,
                from_name: contentResponse.fromName,
                preview_text: contentResponse.previewText,
                to_name: '*|FNAME|* *|LNAME|*'
            },
            tracking: campaignTracking
        };

        const confirmResponses = await prompts([{
            type: "toggle",
            message: "Ready to save the campaign to Mailchimp?",
            name: "confirm",
            active: 'yes',
            inactive: 'no',
            initial: true,
        }]);

        if (!confirmResponses.confirm) {
            console.log(chalk.bold.red("Not creating campaign. Exiting"));
            return {};
        }

        /*
         * This will create the campaign
         */
        const campaign = await mailchimpService.createCampaign(campaignRequest);
        console.log(chalk.bold(`Daily campaign created successfully. Campaign ID = ${campaign.id}`));

        let campaignContent;
        if (recipientsConfig.templateId) {
            campaignContent = await this.createCampaignContent(campaign.id, recipientsConfig.templateId, contentResponse);
        }

        return {campaign: campaign, content: campaignContent};
    }


    async askEnvironmentQuestion(): Promise<{ environment: Project }> {
        return await prompts([{
            type: "select",
            message: "Choose an environment",
            name: "environment",
            choices: [{title: "Prod", value: Project.PROD}, {title: "Stage", value: Project.STAGE}],
            initial: 1
        }], {
            onCancel: (prompt: any) => {
                console.log("Canceled command on prompt", prompt.message);
                return process.exit(0);
            }
        })
    }

    async askRecipientQuestions(): Promise<RecipientsConfiguration> {
        const mailchimpService = this.mailchimpService;
        if (!mailchimpService) {
            throw new Error("Unable to get mailchimp service while asking recipient questions");
        }
        const config = this.currentConfig;
        if (!config) {
            throw new Error("No configuration is set while asking recipient questions");
        }

        const recipientQuestions = [
            {
                type: "toggle",
                name: "useTemplate",
                message: "Use a template for the email?",
                initial: true,
                active: 'yes',
                inactive: 'no',
            },
            {
                type: (prev: boolean, values: RecipientsConfiguration) => values.useTemplate ? "select" : null,
                name: "templateId",
                max: 1,
                message: "Choose a template for the email",
                choices: async (prev: boolean, values: RecipientsConfiguration) => {
                    if (!values.useTemplate) {
                        return []
                    }
                    const templates = await mailchimpService.getAllTemplates(TemplateType.user);
                    return templates.map(template => ({
                        title: template.name,
                        value: template.id,
                    }))
                },
                format: (value: string) => Number(value),
            },
            {
                type: "toggle",
                name: "useSavedSegment",
                message: "Use a pre-built Segment? (choose no to create a new one)",
                initial: false,
                active: 'yes',
                inactive: 'no',
            },
            {
                type: (prev: boolean, values: RecipientsConfiguration) => values.useSavedSegment ? "autocomplete" : null,
                name: "segmentId",
                message: "Choose the segment",
                format: (value: string) => Number(value),
                choices: async (prev: boolean, values: RecipientsConfiguration) => {
                    if (!values.useSavedSegment) {
                        return [];
                    }
                    const segments = await mailchimpService.getAllSavedSegments();
                    return [
                        ...segments.map(segment => ({
                            title: `[${segment.id}] ${segment.name}`,
                            value: segment.id,
                        }))];
                }
            },
            {
                type: (prev: boolean, values: RecipientsConfiguration) => !values.useSavedSegment ? "toggle" : null,
                name: "useTags",
                message: "Add tag filter(s) to your segment??",
                initial: (prev: boolean, values: RecipientsConfiguration) => !values.useSavedSegment,
                active: 'yes',
                inactive: 'no',
            },
            {
                type: (prev: boolean, values: RecipientsConfiguration) => !values.useSavedSegment && values.useTags ? "autocompleteMultiselect" : null,
                name: "tagSegmentIds",
                message: "Select one or more tags",
                // max: 5,
                initial: [],
                format: (strings: string[]) => strings.map(value => Number(value)),
                choices: async (prev: boolean, values: RecipientsConfiguration) => {
                    if (!values.useTags) {
                        console.log("Not getting tags");
                        return [];
                    }

                    const segments = await mailchimpService.getAllTags();
                    return [
                        ...segments.map(segment => ({
                            title: `${segment.name}`,
                            value: segment.id,
                        }))];
                }
            },
            {
                type: (prev: boolean, values: RecipientsConfiguration) => !values.useSavedSegment ? "toggle" : null,
                name: "useAutomations",
                message: "Add automation filter(s) to your segment?",
                initial: (prev: boolean, values: RecipientsConfiguration) => !values.useSavedSegment,
                active: 'yes',
                inactive: 'no',
            },
            {
                type: (prev: boolean, values: RecipientsConfiguration) => !values.useSavedSegment && values.useAutomations ? "autocompleteMultiselect" : null,
                name: "automationIds",
                message: "Choose Automations",
                // max: 5,
                choices: async (prev: boolean, values: RecipientsConfiguration) => {
                    if (!values.useAutomations) {
                        console.log("skipping automations");
                        return [];
                    }

                    const automations = (await mailchimpService.getAllAutomations()).filter(automation => automation.recipients.list_id === config.mailchimp.audience_id);
                    // console.log("first automation", JSON.stringify(automations[0], null, 2));
                    return [
                        ...automations.map(automation => ({
                            title: `${automation.settings.title}`,
                            value: automation.id,
                        }))];
                }
            },
            {
                type: (prev: boolean, values: RecipientsConfiguration) => !values.useSavedSegment && values.useAutomations && values.automationIds.length > 0 ? "select" : null,
                name: "automationOperator",
                message: "What operator should we use for the for the automations?",
                // max: 5,
                choices: async () => {
                    return [
                        {title: SegmentOperator.completed, value: SegmentOperator.completed},
                        {title: SegmentOperator.started, value: SegmentOperator.started},
                        {title: SegmentOperator.not_started, value: SegmentOperator.not_started},
                        {title: SegmentOperator.not_completed, value: SegmentOperator.not_completed}
                    ]
                }
            },

            {
                type: (prev: boolean, values: RecipientsConfiguration) => !values.useSavedSegment ? "select" : null,
                name: "segmentMatchType",
                message: "Segment Match Type",
                choices: [
                    {
                        title: "All",
                        value: SegmentMatchType.all
                    },
                    {
                        title: "Any",
                        value: SegmentMatchType.any
                    }
                ]
            }
        ];

        return await prompts(recipientQuestions, {
            onCancel: (prompt: any) => {
                console.log("Canceled command on prompt", prompt.message);
                return process.exit(0);
            }
        });
    }

    async askUseDefaultsQuestion(): Promise<UseDefaultConfigurationResponse> {
        const useDefaultConfigurationQuestions = [
            {
                type: "toggle",
                message: "Do you want to use the default configuration for the daily emails?",
                name: "useDefault",
                initial: true,
                active: 'yes',
                inactive: 'no',
            },

        ];
        return await prompts(useDefaultConfigurationQuestions, {
            onCancel: (prompt: any) => {
                console.log("Canceled command on prompt", prompt.message);
                return process.exit(0);
            }
        });
    }

    getDefaultMorningTemplateId(): number {
        switch (this.questionType) {
            case QuestionType.DEFAULT:
                return DEFAULT_MORNING_TEMPLATE_ID;
                break;
            case QuestionType.TOPIC:
                return TOPIC_MORNING_TEMPLATE_ID;
                break;
            case QuestionType.PROMPT:
                return PROMPT_MODULE_TEMPLATE_ID;
                break;
        }
    }

    getDefaultReminderTemplateId(): number {
        switch (this.questionType) {
            case QuestionType.DEFAULT:
                return DEFAULT_REMINDER_TEMPLATE_ID;
                break;
            case QuestionType.TOPIC:
                return TOPIC_REMINDER_TEMPLATE_ID;
                break;
            case QuestionType.PROMPT:
                return PROMPT_MODULE_REMINDER_TEMPLATE_ID;
                break;
        }
    }

    async getDefaultRecipientConfiguration(project: Project, configs: { prod: CactusConfig, stage: CactusConfig }): Promise<RecipientsConfiguration> {
        let recipientConfig;
        if (this.project === Project.PROD) {
            recipientConfig = {
                audienceId: configs.prod.mailchimp.audience_id,
                useSavedSegment: true,
                savedSegmentId: 39485,
                useTags: false,
                tagSegmentIds: [],
                environment: Project.PROD,
                useTemplate: true,
                templateId: this.getDefaultMorningTemplateId(),
                segmentMatchType: SegmentMatchType.any,
                useAutomations: false,
                automationIds: [],
                automationOperator: SegmentOperator.completed,
            }
        } else {
            recipientConfig = {
                audienceId: configs.stage.mailchimp.audience_id,
                useSavedSegment: true,
                savedSegmentId: 38081,
                useTags: false,
                tagSegmentIds: [],
                environment: Project.PROD,
                useTemplate: true,
                templateId: this.getDefaultMorningTemplateId(),
                segmentMatchType: SegmentMatchType.any,
                useAutomations: false,
                automationIds: [],
                automationOperator: SegmentOperator.completed,
            };

        }

        if (this.mailchimpService) {
            const segment = await this.mailchimpService.getAudienceSegment(recipientConfig.audienceId, recipientConfig.savedSegmentId);
            console.log(chalk.blue(`Using audience segment "${segment.name}" (id = ${segment.id})`));

            if (recipientConfig.templateId) {
                const template = await this.mailchimpService.getTemplate(recipientConfig.templateId);
                console.log(chalk.blue(`Using template "${template.name}" (id = ${template.id})`));
            } else {
                console.log(chalk.blue(`Not using a template`));
            }
        }

        return recipientConfig;
    }

    async scheduleCampaign(campaign: Campaign, sendDate: string, allowForceRetry: boolean): Promise<boolean> {
        if (!this.mailchimpService) {
            throw new Error("no mailchimp service found");
        }

        const campaignChecklist = await this.mailchimpService.getCampaignSendChecklist(campaign.id);

        let isReady = campaignChecklist.is_ready;
        let didForceRetry = false;


        if (isReady) {
            const warnings = campaignChecklist.items.filter(item => item.type === SendChecklistItemType.warning && item.heading !== "MonkeyRewards");
            // console.log(chalk.green(`Campaign is ready to be scheduled!`));
            if (warnings.length > 0) {
                console.log(chalk.yellow(`However, there are ${warnings.length} warnings. \n${JSON.stringify(warnings, null, 2)}`));
            }
        } else if (!isReady) {
            const issues = campaignChecklist.items.filter(item => item.type !== SendChecklistItemType.success && item.heading !== "MonkeyRewards");

            if (allowForceRetry && issues.length === 1 && issues[0].id === 501 && issues[0].details.toLowerCase() === "your advanced segment is empty.") {
                console.log("Forcing the campaign to schedule using a dirty trick -- setting recipients to be just neil@kinecho.com");
                const updatedCampaignRequest: UpdateCampaignRequest = {
                    settings: {
                        subject_line: campaign.settings.subject_line,
                        from_name: campaign.settings.from_name,
                        reply_to: campaign.settings.reply_to,
                    },
                    recipients: {
                        list_id: campaign.recipients.list_id,
                        segment_opts: {
                            match: SegmentMatchType.all,
                            conditions: [{
                                condition_type: SegmentConditionType.EmailAddress,
                                op: SegmentOperator.is,
                                value: "neil@kinecho.com",
                                field: SegmentField.EMAIL
                            }]
                        }
                    }
                };
                try {
                    const updatedCampaign = await this.mailchimpService.updateCampaign(campaign.id, updatedCampaignRequest);
                    didForceRetry = true;
                    console.log(`successfully updated ${updatedCampaign.id}'s recipients. Rerunning checks`);

                    const updatedChecklist = await this.mailchimpService.getCampaignSendChecklist(campaign.id);
                    const updatedErrors = updatedChecklist.items.filter(item => item.type === SendChecklistItemType.error && item.heading !== "MonkeyRewards");
                    if (updatedChecklist.is_ready) {
                        console.log("Yeehaw! We can now schedule the campaign");
                        const warnings = campaignChecklist.items.filter(item => item.type === SendChecklistItemType.warning && item.heading !== "MonkeyRewards");
                        if (warnings.length > 0) {
                            console.log(chalk.yellow(`However, there are ${warnings.length} warnings. \n${JSON.stringify(warnings, null, 2)}`));
                        }
                        isReady = true;
                    } else {
                        console.log(chalk.yellow("Welp, we still aren't able to schedule the campaign."));
                        console.log(chalk.yellow(JSON.stringify(updatedErrors, null, 2)));
                    }

                } catch (e) {
                    console.error("Unable to update campaign", e);
                }
            } else if (!allowForceRetry) {
                console.log(chalk.red(`Campaign "${chalk.bold(campaign.settings.title)}" is not ready to send. Please correct the following issues in the Mailchimp UI: https://us20.admin.mailchimp.com/campaigns/edit?id=${campaign.web_id}`));
                console.log(chalk.red(JSON.stringify(issues, null, 2)));
            } else {
                console.log(`wasn't able to force a retry. allowRetry: ${allowForceRetry}, issues.length: ${issues.length}. Please try to correct the following issues in the Mailchimp UI: https://us20.admin.mailchimp.com/campaigns/edit?id=${campaign.web_id}`);
                console.log(chalk.red(JSON.stringify(issues, null, 2)));
                return false;
            }

        }

        //doing another check because the else block above could have updated the ready status
        let success = false;
        if (isReady) {
            const result = await this.mailchimpService.scheduleCampaign(campaign.id, {schedule_time: sendDate}, campaign.web_id);
            success = result.success;
            if (success) {
                console.log(chalk.green(`${campaign.settings.title} scheduled successfully!`));
            } else {
                console.warn(chalk.yellow(`Unable to schedule the campaign. Please check the mailchimp UI for more details https://us20.admin.mailchimp.com/campaigns/edit?id=${campaign.web_id}`));
            }
        }

        if (didForceRetry) {
            console.log("Since we forced a retry, we need to revert back");
            const updatedCampaignRequest: UpdateCampaignRequest = {
                settings: {
                    subject_line: campaign.settings.subject_line,
                    from_name: campaign.settings.from_name,
                    reply_to: campaign.settings.reply_to,
                },
                recipients: {
                    list_id: campaign.recipients.list_id,
                    segment_opts: campaign.recipients.segment_opts,
                }
            };
            try {
                await this.mailchimpService.updateCampaign(campaign.id, updatedCampaignRequest);
                console.log(`Nice! Reverted our recipients back successfully.`);
            } catch (e) {
                console.error(chalk.red(`**** Failed to revert back! *****\nPlease make any corrections in the web ui: https://us20.admin.mailchimp.com/campaigns/edit?id=${campaign.web_id}`));
            }
        }

        return success;
    }
}
