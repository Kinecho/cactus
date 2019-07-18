import chalk from "chalk";
import MailchimpQuestionCampaign, {QuestionType} from "@scripts/commands/MailchimpQuestionCampaign";
import {PageConfig} from "@scripts/util/CreatePageUtil";
import {resetConsole} from "@scripts/util/ConsoleUtil";
import {FirebaseCommand} from "@scripts/CommandTypes";
import * as admin from "firebase-admin";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import AdminReflectionPromptService from "@shared/services/AdminReflectionPromptService";
import {getDateFromISOString} from "@shared/util/DateUtil";

const prompts = require('prompts');

export interface InputResponse extends PageConfig {
    question: string,
    topic: string,
}

export default class CreateTopicPrompt extends FirebaseCommand {
    name = "Reflection Prompt: Create a Topic Prompt";
    mailchimpCommand?: MailchimpQuestionCampaign;
    response?: InputResponse;
    description = "New reflection prompt and mailchimp emails (no web pages)";
    showInList = true;


    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService): Promise<void> {
        resetConsole();
        console.log(chalk.bold.green('Let\'s create Reflection Prompt.'));
        console.log(chalk.dim('This will walk you through making a new landing page, email campaign, and record in the database'));
        const response = await prompts([
            {
                type: "text",
                name: 'question',
                message: 'What is the question/prompt text?',
            },
            {
                type: "text",
                name: 'topic',
                message: 'What is the topic?',
                format: (value: string) => value.toLowerCase().trim()
            }
        ]);
        response.reflectionPrompt = true;
        this.response = response;

        const {question, topic} = response;

        const promptId: string = AdminReflectionPromptService.getSharedInstance().createDocId();

        const prompt = new ReflectionPrompt();
        prompt.createdAt = new Date();
        prompt.id = promptId;
        prompt.question = question;
        prompt.topic = topic;

        const {createMailchimp} = await prompts([{
            type: "toggle",
            message: "Create campaign in mailchimp?",
            name: "createMailchimp",
            initial: true,
            active: 'yes',
            inactive: 'no',
        }]);


        if (!createMailchimp) {
            console.log(chalk.yellow("Alrighty then. Moving on."));
        } else {
            const mailchimpCommand = new MailchimpQuestionCampaign();
            mailchimpCommand.questionType = QuestionType.TOPIC;
            mailchimpCommand.project = this.project;
            mailchimpCommand.question = question;
            mailchimpCommand.reflectionPromptId = promptId;
            this.mailchimpCommand = mailchimpCommand;
            await mailchimpCommand.start();

            console.log("setting campaign and reminder campaign on prompt");
            prompt.campaign = mailchimpCommand.campaign;
            prompt.reminderCampaign = mailchimpCommand.reminderCampaign;
            prompt.sendDate = mailchimpCommand.campaign ? getDateFromISOString(mailchimpCommand.campaign.send_time) : undefined;
        }

        const {saveFirestore} = await prompts([{
            type: "toggle",
            message: "Save this question to the database?",
            name: "saveFirestore",
            initial: true,
            active: 'yes',
            inactive: 'no',
        }]);

        if (saveFirestore) {
            await AdminReflectionPromptService.getSharedInstance().save(prompt);
            console.log(chalk.green(`Saved prompt ${promptId} successfully`));
        } else {
            console.warn(chalk.red("DID NOT SAVE PROMPT TO DATABASE"));
        }

        return;
    }
}
