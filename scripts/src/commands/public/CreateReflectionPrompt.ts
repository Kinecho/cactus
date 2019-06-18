import chalk from "chalk";
import {Command} from "@scripts/run";
import MailchimpQuestionCampaign from "@scripts/commands/MailchimpQuestionCampaign";
import {getFilenameFromInput, getUrlFromInput} from "@shared/util/StringUtil";
import SaveQuestionCommand from "@scripts/commands/SaveQuestionCommand";
const prompts = require('prompts');
const webHelpers = require("@web/../helpers");

import {
    addToSitemap,
    createHtml,
    createJS,
    createScss,
    PageConfig,
    updateFirebaseJson,
    updatePagesFile, validatePageName, validateUrl
} from "@scripts/util/CreatePageUtil";
import {resetConsole} from "@scripts/util/ConsoleUtil";

export interface InputResponse extends PageConfig {
    pageName: string,
    title: string,
    pagePath: string,
    writeUrls: boolean,
    looksGood: boolean,
}

export default class CreateReflectionPrompt implements Command {
    name = "Create Page";
    mailchimpCommand?:MailchimpQuestionCampaign;
    response?: InputResponse;

    getQuestions():any[]{
        return [
            {
                type: "text",
                name: 'title',
                message: 'What is the question?',
            },
            {
                type: "text",
                name: 'pageName',
                message: 'File Name (without the extension)',
                initial: (prev: any, values: any) => getFilenameFromInput(values.title),
                validate: validatePageName,
                format: (value:string) => getFilenameFromInput(value),
            },
            {
                type: 'text',
                name: 'pagePath',
                message: 'Page Path: https://cactus.app',
                initial: (prev: any, values: any) => getUrlFromInput(values.title),
                validate: (value: string) => validateUrl(value),
                format: (value: string) => getUrlFromInput(value)
            },
            {
                type: "confirm",
                name: "looksGood",
                message: (prev: any, values: any) => `\n\nHere's the current configuration:
        
${chalk.blue("Page Title")}: ${values.title}
${chalk.blue("Page URL")}: ${values.pagePath ? values.pagePath : chalk.gray("<none>")}
${chalk.blue("Files to create")}: 
 • ${webHelpers.htmlDir}/${values.pageName}.html
 • ${webHelpers.pagesStylesDir}/${values.pageName}.ts
 • ${webHelpers.pagesScriptsDir}/${values.pageName}.scss 
${values.pagePath ? `${chalk.blue("Files to update")}: \n • ${webHelpers.webRoot}/pages.js \n • ${webHelpers.projectRoot}/firebase.json` : ''}
 
Continue?`
            },
        ];
    }

    async start(): Promise<any> {
        resetConsole();
        console.log(chalk.bold.green('Let\'s create Reflection Prompt.'));
        console.log(chalk.dim('This will walk you through making a new landing page, email campaign, and record in the database'));
        const response = await prompts(this.getQuestions());
        this.response = response;
        const {pagePath, title, looksGood} = response;

        if (!looksGood) {
            console.warn(chalk.red("Not creating pages."));
            return;
        }

        console.log("page path is: ", pagePath);
        console.log("title ", title);

        const fileTasks = [
            createHtml(response),
            createJS(response),
            createScss(response),
            addToSitemap(response),
            updateFirebaseJson(response),
            updatePagesFile(response)
        ];

        await Promise.all(fileTasks);

        const mailchimpQuestions = [{
            type: "toggle",
            message: "Create campaign in mailchimp?",
            name: "createMailchimp",
            initial: true,
            active: 'yes',
            inactive: 'no',
        }];

        const {createMailchimp} = await prompts(mailchimpQuestions);

        if (!createMailchimp){
            console.log(chalk.yellow("Alrighty then. Moving on."));
        } else {
            const mailchimpCommand = new MailchimpQuestionCampaign();
            mailchimpCommand.question = response.title;
            mailchimpCommand.contentPath = response.pagePath;
            await mailchimpCommand.start();
            this.mailchimpCommand = mailchimpCommand;
        }

        const firestoreQuestions = [{
            type: "toggle",
            message: "Save this question in the database?",
            name: "saveFirestore",
            initial: true,
            active: 'yes',
            inactive: 'no',
        }];

        const {saveFirestore} = await prompts(firestoreQuestions);

        if (!saveFirestore){
            console.log(chalk.yellow("That's cool. Not saving this question"));
        } else {
            console.log(chalk.bgRed("Saving to firestore.. (not implemented yet)"));
            // const firestoreService = new AdminFirestoreService()
            const selectedProject = this.mailchimpCommand && this.mailchimpCommand.response ? this.mailchimpCommand.response.environment : undefined;
            const firestoreCommand = new SaveQuestionCommand(selectedProject);
            if (this.mailchimpCommand){
                firestoreCommand.campaign = this.mailchimpCommand.campaign;
                firestoreCommand.reminderCampaign = this.mailchimpCommand.reminderCampaign;
                firestoreCommand.question = this.mailchimpCommand.question;
            } else {
                firestoreCommand.question = response.title;
            }
            firestoreCommand.contentPath = response.pagePath;
            firestoreCommand.baseFileName = response.pageName;

            await firestoreCommand.start();
        }

        return;
    }
}
