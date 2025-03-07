import * as chalk from "chalk";
import MailchimpQuestionCampaign, {QuestionType} from "@scripts/commands/MailchimpQuestionCampaign";
import {PageConfig} from "@scripts/util/CreatePageUtil";
import {resetConsole} from "@scripts/util/ConsoleUtil";
import {FirebaseCommand} from "@scripts/CommandTypes";
import * as admin from "firebase-admin";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import {getDateFromISOString} from "@shared/util/DateUtil";
import PromptContent, {Content, ContentType} from "@shared/models/PromptContent";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";

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
            mailchimpCommand.topic = topic;
            this.mailchimpCommand = mailchimpCommand;
            await mailchimpCommand.start();

            console.log("setting campaign and reminder campaign on prompt");
            prompt.campaign = mailchimpCommand.campaign;
            prompt.reminderCampaign = mailchimpCommand.reminderCampaign;
            prompt.sendDate = mailchimpCommand.campaign ? getDateFromISOString(mailchimpCommand.campaign.send_time) : undefined;
        }

        const {saveFirestore} = await prompts([{
            type: "toggle",
            message: "Save this question to the database? This will also create a record in Flamelink.",
            name: "saveFirestore",
            initial: true,
            active: 'yes',
            inactive: 'no',
        }]);

        if (saveFirestore) {
            const savedPrompt = await AdminReflectionPromptService.getSharedInstance().save(prompt);
            console.log("saved the prompt successfully. Id", promptId);

            const content = new PromptContent();
            content.promptId = promptId;
            content.scheduledSendAt = this.mailchimpCommand ? getDateFromISOString(this.mailchimpCommand.scheduleDateISO) : undefined;
            console.log("scheduledSendAt ", content.scheduledSendAt);
            content.subjectLine = prompt.campaign ? prompt.campaign.settings.subject_line : undefined;
            content.mailchimpCampaignId = prompt.campaign ? prompt.campaign.id : undefined;
            content.mailchimpCampaignWebId = prompt.campaign ? prompt.campaign.web_id : undefined;
            content.topic = prompt.topic;
            console.log("attempting to save the prompt content to flamelink");

            const reflection: Content = {
                contentType: ContentType.reflect,
                text: prompt.question,
            };

            content.content = [reflection];

            const savedContent = await AdminPromptContentService.getSharedInstance().save(content);
            if (savedContent) {
                savedPrompt.promptContentEntryId = savedContent.entryId;
                await AdminReflectionPromptService.getSharedInstance().save(savedPrompt);
                console.log("Updated the admin prompt to have the content id", savedContent.entryId);
            }

            console.log(chalk.green(`Saved prompt ${promptId} successfully`));
        } else {
            console.warn(chalk.red("DID NOT SAVE PROMPT TO DATABASE"));
        }

        return;
    }
}
