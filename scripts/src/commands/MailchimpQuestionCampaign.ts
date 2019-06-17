import {Command} from "@scripts/run";
import chalk from "chalk";
import {getCactusConfig, Project} from "@scripts/config";
import {chooseEnvironment} from "@scripts/questionUtil";
import MailchimpService from "@scripts/services/mailchimpService";

const prompts = require('prompts');


export default class MailchimpQuestionCampaign implements Command {
    name = "Mailchimp Question";
    question?: string;
    apiKey?: string;
    campaignId?: string;
    reminderCampaignId?: string;
    response?: {
        audienceId: string;
        question: string;
        environment: Project|string;
    };


    async start(): Promise<void> {
        console.log("Starting mailchimp question");

        const [prodConfig, stageConfig] = await Promise.all([getCactusConfig(Project.PROD), getCactusConfig(Project.STAGE)]);

        const questions = [
            {
                type: "text",
                name: "question",
                message: "What is the question?",
                initial: this.question || "",
            },
            chooseEnvironment,
           ];

        const response = await prompts(questions, {
            onCancel: () => {
                console.log("Canceled command");
                return process.exit(0);
            }});
        this.response = response;

        let config = stageConfig;
        if (response.environment === Project.PROD){
            config = prodConfig;
        }

        console.log("Using config", config);
        console.log("Responses:\n", chalk.blue(JSON.stringify(this.response, null, 2)));

        const mailchimpService = new MailchimpService(config.mailchimp.api_key, config.mailchimp.audience_id);
        // await mailchimpService.getCampaign('00cac1ad22');
        await mailchimpService.getSentTo('00cac1ad22', 1, 1);

        return;
    }

}
