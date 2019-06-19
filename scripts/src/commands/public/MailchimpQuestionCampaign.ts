import {Command} from "@scripts/run";
import chalk from "chalk";
import {getCactusConfig, Project} from "@scripts/config";
import {chooseEnvironment} from "@scripts/questionUtil";
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


export const ONBOARDING_AUTOMATION_ID = "05913cc097";

const prompts = require('prompts');

interface QuestionResponse {
    audienceId: string;
    question: string;
    contentPath: string;
    contentLinkText: string;
    replyTo: string;
    fromName: string;
    subjectLine: string;
    previewText: string;

    useSavedSegment: boolean;
    savedSegmentId?: number;
    useTags: boolean;
    tagSegmentIds: number[];
    environment: Project;
    useTemplate: boolean;
    templateId?: number;
    segmentMatchType: SegmentMatchType;
    inspirationText?:string;
    useAutomations: boolean;
    automationOperator: SegmentOperator;
    automationIds: string[];
}

export default class MailchimpQuestionCampaign implements Command {
    name = "Mailchimp Question";

    question?: string;
    contentPath?:string;

    response?: QuestionResponse;
    project?: Project;
    campaign?:Campaign;
    reminderCampaign?:Campaign;

    async start(): Promise<void> {
        console.log(chalk.bold.cyan("Let's create a mailchimp campaign for a daily question"));
        console.log(chalk.cyan("This program will walk you through creating the campaign. \n" +
            "You'll have the chance to review the settings before creating it in Mailchimp. \n" +
            "Once a campaign is created, it will be in a draft status, so you can always edit/delete it before it starts sending.\n"));

        const [prodConfig, stageConfig] = await Promise.all([getCactusConfig(Project.PROD), getCactusConfig(Project.STAGE)]);

        let config = stageConfig;
        let mailchimpService = new MailchimpService(config.mailchimp.api_key, config.mailchimp.audience_id);
        const questions = [
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
                initial: (prev:string, values:QuestionResponse) => values.question,
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
                ...chooseEnvironment,
                // hint: "this will determine the audience ID",
                onState: (args: { value: string, aborted: boolean }) => {
                    const {value} = args;
                    // console.log("chose", value, "aborted", aborted);
                    if (value === Project.PROD) {
                        config = prodConfig;
                    }
                    mailchimpService = new MailchimpService(config.mailchimp.api_key, config.mailchimp.audience_id);
                }
            },
            {
                type: "toggle",
                name: "useTemplate",
                message: "Use a template for the email?",
                initial: true,
                active: 'yes',
                inactive: 'no',
            },
            {
                type: (prev:boolean, values:QuestionResponse) =>  values.useTemplate ? "select" : null,
                name: "templateId",
                max: 1,
                message: "Choose a template for the email",
                choices: async (prev:boolean, values:QuestionResponse, prompt:any) => {
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
                type: (prev:boolean, values:QuestionResponse) => values.useSavedSegment ? "autocomplete" : null,
                name: "segmentId",
                message: "Choose the segment",
                format: (value:string) => Number(value),
                choices: async (prev:boolean, values:QuestionResponse, prompt:any) => {
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
                type: (prev:boolean, values:QuestionResponse) => !values.useSavedSegment ? "toggle" : null,
                name: "useTags",
                message: "Add tag filter(s) to your segment??",
                initial: (prev:boolean, values:QuestionResponse) => !values.useSavedSegment,
                active: 'yes',
                inactive: 'no',
            },
            {
                type: (prev:boolean, values:QuestionResponse) => !values.useSavedSegment && values.useTags ? "autocompleteMultiselect" : null,
                name: "tagSegmentIds",
                message: "Select one or more tags",
                // max: 5,
                initial: [],
                format: (strings:string[]) => strings.map(value => Number(value)),
                choices: async (prev:boolean, values:QuestionResponse, prompt:any) => {
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
                type: (prev:boolean, values:QuestionResponse) => !values.useSavedSegment ? "toggle" : null,
                name: "useAutomations",
                message: "Add automation filter(s) to your segment?",
                initial: (prev:boolean, values:QuestionResponse) => !values.useSavedSegment,
                active: 'yes',
                inactive: 'no',
            },
            {
                type: (prev:boolean, values:QuestionResponse) => !values.useSavedSegment && values.useAutomations ? "autocompleteMultiselect" : null,
                name: "automationIds",
                message: "Choose Automations",
                // max: 5,
                choices: async (prev:boolean, values:QuestionResponse) => {
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
                type: (prev:boolean, values:QuestionResponse) => !values.useSavedSegment && values.useAutomations && values.automationIds.length > 0 ? "select" : null,
                name: "automationOperator",
                message: "What operator should we use for the for the automations?",
                // max: 5,
                choices: async (prev:boolean, values:QuestionResponse) => {
                   return [
                       {title: SegmentOperator.completed, value: SegmentOperator.completed},
                       {title: SegmentOperator.started, value: SegmentOperator.started},
                       {title: SegmentOperator.not_started, value: SegmentOperator.not_started},
                       {title: SegmentOperator.not_completed, value: SegmentOperator.not_completed}
                   ]
                }
            },

            {
                type: (prev:boolean, values:QuestionResponse) => !values.useSavedSegment ? "select" : null,
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

        const response: QuestionResponse = await prompts(questions, {
            onCancel: (prompt:any, answers:QuestionResponse) => {
                console.log("Canceled command on prompt", prompt.message);
                return process.exit(0);
            }
        });
        this.response = response;

        console.log(chalk.blue("Responses:\n", JSON.stringify(response, null, 2)));
        console.log(chalk.yellow("\nsetting up campaign request"));
        console.log(chalk.blue("setting up recipients"));
        const campaignRecipients:CreateCampaignRequestRecipients = {
            list_id: config.mailchimp.audience_id,
        };

        if (response.savedSegmentId){
            campaignRecipients.segment_options = {
                saved_segment_id: response.savedSegmentId,
            }
        } else {
            const conditions:SegmentCondition[] = [];
            if (response.useTags && response.tagSegmentIds && response.tagSegmentIds.length > 0){
                response.tagSegmentIds.forEach(segmentId => {
                    conditions.push({
                        op: SegmentOperator.static_is,
                        field: SegmentField.static_segment,
                        condition_type: SegmentConditionType.StaticSegment,
                        value: segmentId,
                    })
                })
            }

            if (response.useAutomations && response.automationIds && response.automationIds.length > 0){
                response.automationIds.forEach(automationId => {
                    conditions.push({
                        op: response.automationOperator,
                        field: SegmentField.static_segment,
                        condition_type: SegmentConditionType.StaticSegment,
                        value: automationId,
                    })
                })
            }

            campaignRecipients.segment_options = {
                match: response.segmentMatchType,
                conditions,
            }
        }

        const campaignRequest:CreateCampaignRequest = {
            type: CampaignType.regular,
            recipients: campaignRecipients,
            settings: {
                title: response.question,
                reply_to: response.replyTo,
                subject_line: response.subjectLine,
                from_name: response.fromName
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
        console.log(chalk.bold("Created campaign. Campaign Info\n"), chalk.green(JSON.stringify({id: campaign.id, web_id: campaign.web_id, status: campaign.status}, null, 2)));

        if (response.templateId){
            console.log(chalk.bold("\ncreating template content..."));
            const contentRequest:CampaignContentRequest = {
                template: {
                    id: response.templateId,
                    sections: {
                        [TemplateSection.question]: response.question,
                        [TemplateSection.content_link]: `<a href="${getUrlFromInput(response.contentPath, "cactus.app")}">${response.contentLinkText}</a>`,
                        [TemplateSection.inspiration]: response.inspirationText || "",
                    }
                }
            };
            console.log(chalk.yellow("content request is", JSON.stringify(contentRequest)));
            await mailchimpService.updateCampaignContent(campaign.id, contentRequest);
            console.log(chalk.blue("\nUpdated content for campaign\n"));
        }

        return;
    }
}
