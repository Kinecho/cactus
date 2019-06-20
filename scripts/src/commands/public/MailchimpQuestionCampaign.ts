import {Command} from "@scripts/run";
import chalk from "chalk";
import {getCactusConfig, Project} from "@scripts/config";
import MailchimpService from "@scripts/services/mailchimpService";
import {
    CampaignContentRequest,
    CampaignContentResponse,
    CreateCampaignRequest,
    CreateCampaignRequestRecipients,
    SegmentCondition,
    SegmentConditionType,
    SegmentField,
    SegmentMatchType,
    SegmentOperator,
    TemplateSection
} from "@shared/mailchimp/models/CreateCampaignRequest";
import {Campaign, CampaignType, TemplateType} from "@shared/mailchimp/models/MailchimpTypes";
import {getUrlFromInput, isValidEmail} from "@shared/util/StringUtil";
import {resetConsole} from "@scripts/util/ConsoleUtil";
import {CactusConfig} from "@api/config/CactusConfig";
import {mailchimpTimeZone, makeUTCDateIntoMailchimpDate} from "@shared/util/DateUtil";
import {DateTime} from "luxon";
import {MergeField} from "@shared/mailchimp/models/ListMember";

export const DEFAULT_MORNING_TEMPLATE_ID = 53981;
export const DEFAULT_REMINDER_TEMPLATE_ID = 53981;

const prompts = require('prompts');

interface ContentQuestionResponse {
    question: string;
    contentPath: string;
    contentLinkText: string;
    inspirationText?:string;
    subjectLine: string;
    previewText: string;
    replyTo: string;
    fromName: string;
    sendDateISO: string;
    campaignTitle: string;
}

interface UseDefaultConfigurationResponse {
    useDefault: boolean;
}

interface RecipientsConfiguration {
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
    useDefaultTemplate:boolean;
    useTemplate: boolean;
    templateId?: number;
    campaignTitle: string;
}

export default class MailchimpQuestionCampaign implements Command {
    name = "Mailchimp Question";

    question?: string;
    contentPath?:string;

    campaign?:Campaign;
    reminderCampaign?:Campaign;

    campaignContent?: CampaignContentResponse;
    reminderContentResponse?: CampaignContentResponse;

    project?: Project;
    currentConfig?: CactusConfig;
    stageConfig?:CactusConfig;
    prodConfig?:CactusConfig;
    mailchimpService?:MailchimpService;

    async start(): Promise<void> {
        console.log(chalk.bold.cyan("Let's create a mailchimp campaign for a daily question"));
        console.log(chalk.cyan("This program will walk you through creating the campaign. \n" +
            "You'll have the chance to review the settings before creating it in Mailchimp. \n" +
            "Once a campaign is created, it will be in a draft status, so you can always edit/delete it before it starts sending.\n"));

        const [prodConfig, stageConfig] = await Promise.all([getCactusConfig(Project.PROD), getCactusConfig(Project.STAGE)]);
        this.prodConfig = prodConfig;
        this.stageConfig = stageConfig;

        if (!this.project){
            const {environment} = await this.askEnvironmentQuestion();
            this.project = environment;
        } else {
            console.log("environment has been set to " + this.project);
        }

        if (this.project === Project.PROD){
            this.currentConfig = prodConfig;
        } else {
            this.currentConfig = stageConfig;
        }
        this.mailchimpService = new MailchimpService(this.currentConfig.mailchimp.api_key, this.currentConfig.mailchimp.audience_id);

        const contentResponse = await this.askContentQuestions();
        const defaultConfigurationResponse =  await this.askUseDefaultsQuestion();

        let recipientsConfig;
        if (defaultConfigurationResponse.useDefault) {
            console.log(`Great! Using the default configuration for ${this.project}`);
            recipientsConfig = await this.getDefaultRecipientConfiguration(this.project, {prod: prodConfig, stage: stageConfig});
        } else {
            //need to set up the content response
            recipientsConfig = await this.askRecipientQuestions();
        }

        console.log(chalk.blue("Responses:\n", JSON.stringify(recipientsConfig, null, 2)));

        const {campaign, content} = await this.createCampaign(contentResponse, recipientsConfig);
        this.campaign = campaign;
        this.campaignContent = content;

        const reminderConfig = await this.askReminderQuestions(contentResponse);
        if (reminderConfig.scheduleReminder) {
            const reminderResponse = await this.createReminderCampaign(contentResponse, recipientsConfig, reminderConfig);
            this.reminderCampaign = reminderResponse.campaign;
            this.reminderContentResponse = reminderResponse.content;
        }

        return;
    }

    async askContentQuestions(): Promise<ContentQuestionResponse>{
       const contentQuestions = [
            {
                type: "text",
                name: "question",
                message: "What is the question?",
                initial: this.question || "",
            },
            {
                type: "text",
                name: "contentPath",
                message: "Go Deeper content url",
                initial: () => getUrlFromInput(this.contentPath),
                format: (value:string) => getUrlFromInput(value)
            },
            {
                type: "text",
                name: "contentLinkText",
                message: "Content link text",
                initial: "Read More..."
            },
            {
                type: "text",
                name: "inspirationText",
                message: "Inspiration text (optional)",
            },
            {
                type: "text",
                name: "subjectLine",
                message: "Subject Line",
                initial: (prev:string, values:ContentQuestionResponse) => values.question,
            },
            {
                type: "text",
                name: "previewText",
                message: "Preview Text",
                initial: (prev:string, values:ContentQuestionResponse) => values.subjectLine,
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
                initial: "hello@cactus.app",
                validate: (value:string) => isValidEmail(value)  && value.endsWith("cactus.app") ? true : 'Please enter a valid email that ends in \"cactus.app\"'
            },
            {
                type: "date",
                name: "sendDateISO",
                message: "When should this email be sent?",
                mask: `dddd, MMMM D, YYYY "at" h:mm A "Mountain Time"`,
                initial: new Date((new Date()).setHours(17, 0, 0, 0)),
                validate: (date:Date) => {
                    return date.getTime() <= (new Date()).setHours(0, 0, 0 ,0) ? 'The date must be in the future' : true
                },
                format: (value:Date) => {
                    console.log("formatting date: timezone offset", value.getTimezoneOffset());
                    console.log("formatting date", value, "from Mountain to UTC");
                    const dateString =  makeUTCDateIntoMailchimpDate(value, true, mailchimpTimeZone);
                    console.log("iso date string", dateString);
                    return dateString;
                }
            },
            {
                type: "text",
                name: "campaignTitle",
                message: "Campaign Title",
                initial: (prev:string, values:ContentQuestionResponse) => {
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

    async createReminderCampaign(originalContentResponse:ContentQuestionResponse,
                                 recipientsConfig:RecipientsConfiguration,
                                 reminderConfig: ReminderConfiguration): Promise<{campaign?: Campaign, content?: CampaignContentResponse}>{

        if (!this.campaign){
            throw new Error("Can't create a reminder because no original campaign can be found");
        }

        const mailchimpService = this.mailchimpService;
        if (!mailchimpService){
            throw new Error("No mailchimp service was available - unable to save campaign");
        }

        const campaignWebId = this.campaign.web_id;

        const campaignRecipients:CreateCampaignRequestRecipients = {
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

        const campaignRequest:CreateCampaignRequest = {
            type: CampaignType.regular,
            recipients: campaignRecipients,
            settings: {
                title: reminderConfig.campaignTitle,
                reply_to: reminderConfig.replyTo,
                subject_line: reminderConfig.subjectLine,
                from_name: reminderConfig.fromName,
                preview_text: reminderConfig.previewText,
            }
        };

        resetConsole();
        console.log(chalk.bold.yellow("The configuration for the reminder campaign is this:"));
        console.log(chalk.yellow(JSON.stringify(campaignRequest, null, 2)));

        const confirmResponses = await prompts([{
            type: "toggle",
            message: "Please verify the configuration looks right. Ready to Create Campaign?",
            name: "confirm",
            active: 'yes',
            inactive: 'no',

        }]);

        if (!confirmResponses.confirm) {
            console.log(chalk.bold.red("Not creating reminder campaign. Exiting"));
            return {};
        }

        /*
         * This will create the campaign
         */
        const reminderCampaign = await mailchimpService.createCampaign(campaignRequest);

        console.log(chalk.bold("Created campaign. Campaign Info\n"), chalk.green(JSON.stringify(reminderCampaign, null, 2)));

        let campaignContent;
        if (reminderConfig.useTemplate && reminderConfig.templateId || reminderConfig.useDefaultTemplate){
            campaignContent = await this.createCampaignContent(reminderCampaign.id,
                reminderConfig.templateId || DEFAULT_REMINDER_TEMPLATE_ID,
                originalContentResponse);
        }

        return {campaign: reminderCampaign, content: campaignContent};
    }

    async createCampaignContent(campaignId:string, templateId:number, contentResponse:ContentQuestionResponse):Promise<CampaignContentResponse|undefined> {
        const mailchimpService = this.mailchimpService;
        if (!mailchimpService){
            throw new Error("No mailchimp service was available - unable to save campaign");
        }


        let campaignContent;

        console.log(chalk.bold("\ncreating template content..."));
        const contentRequest:CampaignContentRequest = {
            template: {
                id: templateId,
                sections: {
                    [TemplateSection.question]: contentResponse.question,
                    [TemplateSection.content_link]: `<a href="${getUrlFromInput(contentResponse.contentPath, "cactus.app")}">${contentResponse.contentLinkText}</a>`,
                    [TemplateSection.inspiration]: contentResponse.inspirationText || "",
                }
            }
        };
        console.log(chalk.yellow("content request is", JSON.stringify(contentRequest)));
        campaignContent = await mailchimpService.updateCampaignContent(campaignId, contentRequest);
        console.log(chalk.blue("\nUpdated content for campaign\n"));

        return campaignContent
    }

    async askReminderQuestions(contentConfig: ContentQuestionResponse):Promise<ReminderConfiguration>{
        const mailchimpService = this.mailchimpService;
        if (!mailchimpService){
            throw new Error("No mailchimp service was available - unable to save campaign");
        }


        return await prompts([
            {
                type: "toggle",
                name: "scheduleReminder",
                message: "Do you want to schedule the reminder email now?",
                initial: true,
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
                type: "toggle",
                name: "useDefaultTemplate",
                message: "Use the default reminder template?",
                initial: true,
                active: "yes",
                inactive: "no"
            },
            {
                type: (prev:boolean, values:ReminderConfiguration) => values.useDefaultTemplate ? null : "toggle",
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
                        console.log("not fetching templates");
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

    async createCampaign(contentResponse:ContentQuestionResponse, recipientsConfig:RecipientsConfiguration):Promise<{campaign?: Campaign, content?: CampaignContentResponse}>{
        const mailchimpService = this.mailchimpService;
        if (!mailchimpService){
            throw new Error("No mailchimp service was available - unable to save campaign");
        }

        const campaignRecipients:CreateCampaignRequestRecipients = {
            list_id: recipientsConfig.audienceId,
        };

        if (recipientsConfig.savedSegmentId){
            campaignRecipients.segment_opts = {
                saved_segment_id: recipientsConfig.savedSegmentId,
            }
        } else {
            const conditions:SegmentCondition[] = [];
            if (recipientsConfig.useTags && recipientsConfig.tagSegmentIds && recipientsConfig.tagSegmentIds.length > 0){
                recipientsConfig.tagSegmentIds.forEach(segmentId => {
                    conditions.push({
                        op: SegmentOperator.static_is,
                        field: SegmentField.static_segment,
                        condition_type: SegmentConditionType.StaticSegment,
                        value: segmentId,
                    })
                })
            }

            if (recipientsConfig.useAutomations && recipientsConfig.automationIds && recipientsConfig.automationIds.length > 0){
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

        const campaignRequest:CreateCampaignRequest = {
            type: CampaignType.regular,
            recipients: campaignRecipients,
            settings: {

                title: contentResponse.campaignTitle,
                reply_to: contentResponse.replyTo,
                subject_line: contentResponse.subjectLine,
                from_name: contentResponse.fromName,
                preview_text: contentResponse.previewText,
            }
        };

        resetConsole();
        console.log(chalk.bold.yellow("The configuration for the campaign is this:"));
        console.log(chalk.yellow(JSON.stringify(campaignRequest, null, 2)));

        const confirmResponses = await prompts([{
            type: "toggle",
            message: "Please verify the configuration looks right. Ready to Create Campaign?",
            name: "confirm",
            active: 'yes',
            inactive: 'no',

        }]);

        if (!confirmResponses.confirm) {
            console.log(chalk.bold.red("Not creating campaign. Exiting"));
            return {};
        }

        /*
         * This will create the campaign
         */
        const campaign = await mailchimpService.createCampaign(campaignRequest);
        console.log(chalk.bold("Created campaign. Campaign Info\n"), chalk.green(JSON.stringify(campaign, null, 2)));

        let campaignContent;
        if (recipientsConfig.templateId){
            campaignContent = await this.createCampaignContent(campaign.id, recipientsConfig.templateId, contentResponse);
        }

        return {campaign: campaign, content: campaignContent};
    }


    async askEnvironmentQuestion() :Promise<{environment:Project}> {
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
        if (!mailchimpService){
            throw new Error("Unable to get mailchimp service while asking recipient questions");
        }
        const config = this.currentConfig;
        if (!config){
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
                type: (prev:boolean, values:RecipientsConfiguration) =>  values.useTemplate ? "select" : null,
                name: "templateId",
                max: 1,
                message: "Choose a template for the email",
                choices: async (prev:boolean, values:RecipientsConfiguration) => {
                    if (!values.useTemplate){
                        console.log("not fetching templates");
                        return []
                    }
                    const templates = await mailchimpService.getAllTemplates(TemplateType.user);
                    return templates.map(template => ({
                        title: template.name,
                        value: template.id,
                    }))
                },
                format: (value:string) => Number(value),
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
                type: (prev:boolean, values:RecipientsConfiguration) => values.useSavedSegment ? "autocomplete" : null,
                name: "segmentId",
                message: "Choose the segment",
                format: (value:string) => Number(value),
                choices: async (prev:boolean, values:RecipientsConfiguration) => {
                    if (!values.useSavedSegment){
                        console.log("not fetching segments");
                        return [];
                    }
                    const segments = await mailchimpService.getAllSavedSegments();
                    return [
                        ...segments.map(segment => ({
                            title: `[${segment.id}] ${segment.name}` ,
                            value: segment.id,
                        }))];
                }
            },
            {
                type: (prev:boolean, values:RecipientsConfiguration) => !values.useSavedSegment ? "toggle" : null,
                name: "useTags",
                message: "Add tag filter(s) to your segment??",
                initial: (prev:boolean, values:RecipientsConfiguration) => !values.useSavedSegment,
                active: 'yes',
                inactive: 'no',
            },
            {
                type: (prev:boolean, values:RecipientsConfiguration) => !values.useSavedSegment && values.useTags ? "autocompleteMultiselect" : null,
                name: "tagSegmentIds",
                message: "Select one or more tags",
                // max: 5,
                initial: [],
                format: (strings:string[]) => strings.map(value => Number(value)),
                choices: async (prev:boolean, values:RecipientsConfiguration) => {
                    if (!values.useTags){
                        console.log("Not getting tags");
                        return [];
                    }

                    const segments = await mailchimpService.getAllTags();
                    return [
                        ...segments.map(segment => ({
                            title: `${segment.name}` ,
                            value: segment.id,
                        }))];
                }
            },
            {
                type: (prev:boolean, values:RecipientsConfiguration) => !values.useSavedSegment ? "toggle" : null,
                name: "useAutomations",
                message: "Add automation filter(s) to your segment?",
                initial: (prev:boolean, values:RecipientsConfiguration) => !values.useSavedSegment,
                active: 'yes',
                inactive: 'no',
            },
            {
                type: (prev:boolean, values:RecipientsConfiguration) => !values.useSavedSegment && values.useAutomations ? "autocompleteMultiselect" : null,
                name: "automationIds",
                message: "Choose Automations",
                // max: 5,
                choices: async (prev:boolean, values:RecipientsConfiguration) => {
                    if (!values.useAutomations){
                        console.log("skipping automations");
                        return [];
                    }

                    const automations = (await mailchimpService.getAllAutomations()).filter(automation => automation.recipients.list_id === config.mailchimp.audience_id);
                    // console.log("first automation", JSON.stringify(automations[0], null, 2));
                    return [
                        ...automations.map(automation => ({
                            title: `${automation.settings.title}` ,
                            value: automation.id,
                        }))];
                }
            },
            {
                type: (prev:boolean, values:RecipientsConfiguration) => !values.useSavedSegment && values.useAutomations && values.automationIds.length > 0 ? "select" : null,
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
                type: (prev:boolean, values:RecipientsConfiguration) => !values.useSavedSegment ? "select" : null,
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

    async askUseDefaultsQuestion():Promise<UseDefaultConfigurationResponse> {
        const useDefaultConfigurationQuestions = [
            {
                type: "toggle",
                message: "Do you want to use the default configuration for the daily emails?",
                name: "useDefault",
                initial: true,
                active: 'yes',
                inactive: 'no, create my own',
            },

        ];
        return await prompts(useDefaultConfigurationQuestions, {
            onCancel: (prompt: any) => {
                console.log("Canceled command on prompt", prompt.message);
                return process.exit(0);
            }
        });
    }

    async getDefaultRecipientConfiguration(project:Project, configs:{prod:CactusConfig, stage:CactusConfig}): Promise<RecipientsConfiguration> {
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
                templateId: DEFAULT_MORNING_TEMPLATE_ID,
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
                templateId: DEFAULT_MORNING_TEMPLATE_ID,
                segmentMatchType: SegmentMatchType.any,
                useAutomations: false,
                automationIds: [],
                automationOperator: SegmentOperator.completed,
            };

        }

        if (this.mailchimpService){
            const segment = await this.mailchimpService.getAudienceSegment(recipientConfig.audienceId, recipientConfig.savedSegmentId);
            console.log(chalk.blue(`Using audience segment "${segment.name }" (id = ${segment.id})` ));

            if (recipientConfig.templateId){
                const template = await this.mailchimpService.getTemplate(recipientConfig.templateId);
                console.log(chalk.blue(`Using template "${template.name}" (id = ${template.id})`));
            } else {
                console.log(chalk.blue(`Not using a template`));
            }

        }

        return recipientConfig;
    }
}
