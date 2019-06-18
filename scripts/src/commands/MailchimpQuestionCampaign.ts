import {Command} from "@scripts/run";
import chalk from "chalk";
import {getCactusConfig, Project} from "@scripts/config";
import {chooseEnvironment} from "@scripts/questionUtil";
import MailchimpService from "@scripts/services/mailchimpService";
import {
    CampaignContentRequest, CreateCampaignRequest,
    SegmentMatchType,
    TemplateSection
} from "@shared/mailchimp/models/CreateCampaignRequest";
import {Campaign, CampaignType, TemplateType} from "@shared/mailchimp/models/MailchimpTypes";
// import {CreateCampaignRequest} from "@shared/mailchimp/models/CreateCampaignRequest";
// import {CampaignType} from "@shared/mailchimp/models/MailchimpTypes";

const prompts = require('prompts');


interface QuestionResponse {
    audienceId: string;
    question: string;
    contentUrl: string;
    contentLinkText: string;
    useSegments: boolean;
    segmentIds?: number[];
    useTags: boolean;
    tagSegmentIds: number[];
    environment: Project;
    templateId?: number;
    segmentMatchType?: SegmentMatchType;
    inspirationText?:string;
}

export default class MailchimpQuestionCampaign implements Command {
    name = "Mailchimp Question";
    question?: string;
    contentUrl?:string;

    response?: QuestionResponse;
    project?: Project;
    campaign?:Campaign;
    reminderCampaign?:Campaign;

    async start(): Promise<void> {
        console.log("Starting mailchimp question");

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
                name: "contentUrl",
                message: "Go Deeper content url",
                initial: this.contentUrl || "",
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
                type: "select",
                name: "templateId",
                max: 1,
                message: "Choose a template (optional)",
                choices: async () => {
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
                name: "useSegments",
                message: "Use Segment(s)?",
                initial: true,
                active: 'yes',
                inactive: 'no',
            },
            {
                type: (prev:boolean) => prev ? "autocompleteMultiselect" : null,
                name: "segmentIds",
                message: "Choose a segment",
                format: (strings:string[]) => strings.map(value => Number(value)),
                choices: async () => {
                    const segments = await mailchimpService.getAllSavedSegments();
                    return [
                        ...segments.map(segment => ({
                            title: `[${segment.type}]\t${segment.name} ` ,
                            value: segment.id,
                        }))];
                }
            },
            {
                type: "toggle",
                name: "useTags",
                message: "Use Tag(s)?",
                initial: true,
                active: 'yes',
                inactive: 'no',
            },
            {
                type: (prev:boolean) => prev ? "autocompleteMultiselect" : null,
                name: "tagSegmentIds",
                message: "Choose tags",
                // max: 5,
                format: (strings:string[]) => strings.map(value => Number(value)),
                choices: async () => {
                    const segments = await mailchimpService.getAllTags();
                    return [
                        ...segments.map(segment => ({
                            title: `${segment.name}` ,
                            value: segment.id,
                        }))];
                }
            },
            {
                type: "select",
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
            onCancel: () => {
                console.log("Canceled command");
                return process.exit(0);
            }
        });
        this.response = response;
        // this.project = response.
        console.log(chalk.blue("Responses:\n", JSON.stringify(response, null, 2)));


        // await mailchimpService.getCampaign('00cac1ad22');
        // await mailchimpService.getSentTo('00cac1ad22', {count: 1});

        // const segments = await mailchimpService.getSavedSegments();
        // console.log("Segments", chalk.blue(JSON.stringify(segments, null, 2)));


        const confirmResponses = await prompts([{
            type: "toggle",
            message: "Create Campaign",
            name: "confirm",
            active: 'yes',
            inactive: 'no',

        }]);

        if (!confirmResponses.confirm) {
            console.log(chalk.red("Not creating campaign. Exiting"));
            return;
        }

        console.log(chalk.yellow("\ncreating campaign..."));
        const campaignRequest:CreateCampaignRequest = {
            type: CampaignType.regular,
            recipients: {
                list_id: config.mailchimp.audience_id,
            },
            settings: {
                title: response.question
            }
        };
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
                        [TemplateSection.content_link]: `<a href="${response.contentUrl}">${response.contentLinkText}</a>`,
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
