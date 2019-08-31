import chalk from "chalk";
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

export default class CreatePromptModule extends FirebaseCommand {
    name = "Reflection Prompt: Create a Prompt Module";
    mailchimpCommand?: MailchimpQuestionCampaign;
    response?: InputResponse;
    description = "New reflection prompt in Flamelink and Mailchimp Emails";
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

        const reflection: Content = {
            contentType: ContentType.reflect,
            text: prompt.question,
        };

        const content = new PromptContent();
        content.promptId = promptId;
        content.content = [reflection];

        const savedContent = await AdminPromptContentService.getSharedInstance().save(content);
        if (savedContent) {
            console.log("Saved shell Content Prompt record to Flamelink", savedContent.entryId);
            prompt.promptContentEntryId = savedContent.entryId;
            content.entryId = savedContent.entryId;
        } else { 
            console.error("Could not save shell Flamelink, aborting!");
            return;
        }

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
            mailchimpCommand.questionType = QuestionType.PROMPT;
            mailchimpCommand.project = this.project;
            mailchimpCommand.question = question;
            mailchimpCommand.reflectionPromptId = promptId;
            mailchimpCommand.topic = topic;
            if (savedContent) { 
                mailchimpCommand.promptContentId = savedContent.entryId;
            }
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
            await AdminReflectionPromptService.getSharedInstance().save(prompt);
            console.log("saved the prompt successfully. Id", promptId);

            savedContent.promptId = promptId;
            savedContent.scheduledSendAt = this.mailchimpCommand ? this.mailchimpCommand.scheduleDateISO : undefined;
            console.log("scheduledSendAt ", content.scheduledSendAt);
            savedContent.subjectLine = prompt.campaign ? prompt.campaign.settings.subject_line : undefined;
            savedContent.mailchimpCampaignId = prompt.campaign ? prompt.campaign.id : undefined;
            savedContent.mailchimpCampaignWebId = prompt.campaign ? prompt.campaign.web_id : undefined;
            savedContent.topic = prompt.topic;

            console.log("attempting to update the prompt content in flamelink");
            await AdminPromptContentService.getSharedInstance().save(savedContent);

            console.log(chalk.green(`Saved prompt ${promptId} successfully`));
        } else {
            console.warn(chalk.red("DID NOT SAVE PROMPT TO DATABASE"));
        }

        return;
    }
}
