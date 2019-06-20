import {Command} from "@scripts/run";
import chalk from "chalk";
import {getCactusConfig, Project} from "@scripts/config";
import MailchimpService from "@scripts/services/mailchimpService";
import {
    CampaignContentRequest,
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

export const ONBOARDING_AUTOMATION_ID = "05913cc097";

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

export default class MailchimpQuestionCampaign implements Command {
    name = "Mailchimp Question";

    question?: string;
    contentPath?:string;

    campaign?:Campaign;
    reminderCampaign?:Campaign;

    project?: Project;
    currentConfig?: CactusConfig;
    stageConfig?:CactusConfig;
    prodConfig?:CactusConfig;
    mailchimpService?:MailchimpService;

    contentQuestions = [
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
        }
    ];

    async askEnvironmentQuestion() :Promise<{environment:Project}> {
        return await prompts([{
            type: "select",
            message: "Choose an environment",
            name: "environment",
            choices: [{title: "Prod", value: Project.PROD}, {title: "Stage", value: Project.STAGE}],
            initial: 1
        }], {
            onCancel: (prompt: any, answers: RecipientsConfiguration) => {
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
                choices: async (prev:boolean, values:RecipientsConfiguration, prompt:any) => {
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
                choices: async (prev:boolean, values:RecipientsConfiguration) => {
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
            onCancel: (prompt: any, answers: RecipientsConfiguration) => {
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
            onCancel: (prompt: any, answers: RecipientsConfiguration) => {
                console.log("Canceled command on prompt", prompt.message);
                return process.exit(0);
            }
        });
    }

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

        const mailchimpService = new MailchimpService(this.currentConfig.mailchimp.api_key, this.currentConfig.mailchimp.audience_id);
        this.mailchimpService = mailchimpService;

        const contentResponse:ContentQuestionResponse = await prompts(this.contentQuestions);
        const defaultConfigurationResponse:UseDefaultConfigurationResponse =  await this.askUseDefaultsQuestion();

        let recipientsConfig:RecipientsConfiguration;
        if (defaultConfigurationResponse.useDefault) {
            console.log(`Great! Using the default configuration for ${this.project}`);
            recipientsConfig = await this.getDefaultRecipientConfiguration(this.project, {prod: prodConfig, stage: stageConfig});

        } else {
            //need to set up the content response
            recipientsConfig = await this.askRecipientQuestions();
        }

        console.log(chalk.blue("Responses:\n", JSON.stringify(recipientsConfig, null, 2)));
        console.log(chalk.yellow("\nsetting up campaign request"));
        console.log(chalk.blue("setting up recipients"));
        const campaignRecipients:CreateCampaignRequestRecipients = {
            list_id: this.currentConfig.mailchimp.audience_id,
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
                title: contentResponse.question,
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
            return;
        }


        /*
         * This will create the campaign
         */
        const campaign = await mailchimpService.createCampaign(campaignRequest);

        this.campaign = campaign;
        // let campaignSummary = {id: campaign.id, web_id: campaign.web_id, status: campaign.status};
        console.log(chalk.bold("Created campaign. Campaign Info\n"), chalk.green(JSON.stringify(campaign, null, 2)));

        if (recipientsConfig.templateId){
            console.log(chalk.bold("\ncreating template content..."));
            const contentRequest:CampaignContentRequest = {
                template: {
                    id: recipientsConfig.templateId,
                    sections: {
                        [TemplateSection.question]: contentResponse.question,
                        [TemplateSection.content_link]: `<a href="${getUrlFromInput(contentResponse.contentPath, "cactus.app")}">${contentResponse.contentLinkText}</a>`,
                        [TemplateSection.inspiration]: contentResponse.inspirationText || "",
                    }
                }
            };
            console.log(chalk.yellow("content request is", JSON.stringify(contentRequest)));
            await mailchimpService.updateCampaignContent(campaign.id, contentRequest);
            console.log(chalk.blue("\nUpdated content for campaign\n"));
        }

        return;
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
                templateId: 53353,
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
                templateId: 53353,
                segmentMatchType: SegmentMatchType.any,
                useAutomations: false,
                automationIds: [],
                automationOperator: SegmentOperator.completed,
            };

        }

        if (this.mailchimpService ){

            const segment = await this.mailchimpService.getAudienceSegment(recipientConfig.audienceId, recipientConfig.savedSegmentId);
            console.log(chalk.blue(`Using audience segment "${segment.name }" (id = ${segment.id})` ));

            if (recipientConfig.templateId){
                const template = await this.mailchimpService.getTemplate(recipientConfig.templateId)
                console.log(chalk.blue(`Using template "${template.name}" (id = ${template.id})`));
            } else {
                console.log(chalk.blue(`Not using a template`));
            }

        }

        return recipientConfig;
    }
}
