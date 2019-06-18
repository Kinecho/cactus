import {Command} from "@scripts/run";
import chalk from "chalk";
import {getCactusConfig, Project} from "@scripts/config";
import {chooseEnvironment} from "@scripts/questionUtil";
import MailchimpService from "@scripts/services/mailchimpService";
import {SegmentMatchType} from "@shared/mailchimp/models/CreateCampaignRequest";
// import {CreateCampaignRequest} from "@shared/mailchimp/models/CreateCampaignRequest";
// import {CampaignType} from "@shared/mailchimp/models/MailchimpTypes";

const prompts = require('prompts');


interface QuestionResponse {
    audienceId: string;
    question: string;
    useSegments: boolean,
    segmentIds?: number[],
    useTags: boolean,
    tagSegmentIds: number[],
    environment: Project | string;
    segmentMatchType?: SegmentMatchType
}

export default class MailchimpQuestionCampaign implements Command {
    name = "Mailchimp Question";
    question?: string;
    apiKey?: string;
    campaignId?: string;
    reminderCampaignId?: string;
    response?: QuestionResponse;


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

        if (confirmResponses.confirm) {

            // const campaignRequest:CreateCampaignRequest = {
            //     type: CampaignType.regular,
            //     recipients: {
            //         list_id: config.mailchimp.audience_id,
            //     },
            //     settings: {
            //         title: response.question
            //     }
            // };
            // await mailchimpService.createCampaign(campaignRequest);
            console.log("creating campaign");
        } else {
            console.log("not creating campaign")
        }


        return;
    }

}
