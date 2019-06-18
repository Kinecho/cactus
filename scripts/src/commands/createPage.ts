import chalk from "chalk";
import {Command} from "@scripts/run";
import MailchimpQuestionCampaign from "@scripts/commands/MailchimpQuestionCampaign";
import {getFilenameFromInput, getUrlFromInput} from "@shared/util/StringUtil";
import SaveQuestionCommand from "@scripts/commands/SaveQuestionCommand";
const prompts = require('prompts');
const webHelpers = require("@web/../helpers");
const fs = require("fs").promises;
const path = require("path");


const firebaseConfigPath = `${webHelpers.projectRoot}/firebase.json`;
const pagesPath = `${webHelpers.webRoot}/pages.js`;
const pages = require(pagesPath) as { [name: string]: { title: string, path: string } };

export interface InputResponse {
    pageName: string,
    title: string,
    pagePath: string,
    writeUrls: boolean,
    looksGood: boolean,
}

function getFirebaseConfig(): { hosting: { rewrites: { source: string, destination: string }[] } } {
    return require(`${webHelpers.projectRoot}/firebase.json`);
}

export function validatePageName(input: string): boolean | string {
    const htmlName = getFilenameFromInput(input, "html");
    const htmlExists = fs.existsSync(path.join(`${webHelpers.htmlDir}`, htmlName));
    const pagesExists = !!pages[htmlName];

    if (!htmlExists && !pagesExists) {
        return true;
    }

    return `A page with this name already exists. Please pick a new value`;
}

export function validateUrl(input: string): boolean | string {
    const firebaseUrl = getFirebaseConfig().hosting.rewrites.find(rewrite => rewrite.source === input);
    const pagesUrl = Object.values(pages).find(page => page.path === input);

    if (!firebaseUrl && !pagesUrl) {
        return true;
    }

    return `This URL is already mapped. Please choose a new URL.`;
}



export default class CreatePage implements Command {
    name = "Create Page";
    mailchimpCommand?:MailchimpQuestionCampaign;
    response?: InputResponse;

    getQuestions():any[]{
        return [
            {
                type: "text",
                name: 'title',
                message: 'Question',
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
 
All Good?`
            },
        ];
    }


    static async updateFirebaseJson(response:InputResponse):Promise<void> {
        const config = getFirebaseConfig();
        const rewrites = config.hosting.rewrites;

        const newPage = {
            source: `${response.pagePath}`,
            destination: `/${response.pageName}.html`
        };

        const existing = rewrites.find(page => page.source === newPage.source || page.destination === newPage.source);
        if (existing) {
            console.warn("A page with the same source or destination was found in firebase.json");
            console.warn("NOT UPDATING FIREBASE.JSON");
            return;
        }

        rewrites.unshift(newPage);

        console.log("Adding page to Firebase Config:\n", chalk.yellow(JSON.stringify(newPage, null, 4)));

        await fs.writeFile(firebaseConfigPath, JSON.stringify(config, null, 4), 'utf8')
        return;
    }

    static async updatePagesFile(response:InputResponse):Promise<void> {
        if (pages[response.pageName]) {
            console.warn("A Page with the same key already exists in pages.js");
        }
        const newPage = {
            title: response.title,
            path: response.pagePath,
        };

        pages[response.pageName] = newPage;

        console.log("\nAdding new page to pages.js:\n", chalk.yellow(JSON.stringify(newPage, null, 4)));

        const data = `module.exports = ${JSON.stringify(pages, null, 4)}`;

        return fs.writeFile(pagesPath, data, 'utf8');
    }

    static async createHtml(response:InputResponse):Promise<void> {
        const htmlOutputPath = `${webHelpers.htmlDir}/${response.pageName}.html`;
        const templateFile = path.resolve(webHelpers.srcDir, "templates", "page.html");
        console.log("creating HTML from template\n", chalk.blue(htmlOutputPath), "\n");


        const data = await fs.readFile(templateFile, 'utf8');
        const content = data.replace(/\$PAGE_TITLE\$/g, response.title);
        await fs.writeFile(htmlOutputPath, content, 'utf8');
        return;
    }

    static async addToSitemap(response:InputResponse):Promise<void> {
        const sitemapFile = path.resolve(webHelpers.projectRoot, "web", "src", "assets", "sitemaps", "questions.txt");
        console.log("appending new page URL to Questions Sitemap\n");

        const newUrl = "\n" + "https://cactus.app" + response.pagePath;

        await fs.appendFile(sitemapFile, newUrl, 'utf8');
        return;
    }

    static async createJS(response:InputResponse):Promise<void> {
        const outputFilePath = `${webHelpers.pagesScriptsDir}/${response.pageName}.ts`;
        // console.log("creating js file with response = ", response);
        console.log("creating javascript file from template:\n", chalk.blue(outputFilePath), "\n");

        const templateFile = path.resolve(webHelpers.srcDir, "templates", "page_script.ts");

        const data = await fs.readFile(templateFile, 'utf8');
        const content = data.replace(/\$PAGE_NAME\$/g, response.pageName);

        await fs.writeFile(outputFilePath, content, 'utf8');
        return;

    }

    static async createScss(response:InputResponse):Promise<void> {
        const templateFile = path.resolve(webHelpers.srcDir, "templates", "page_style.scss");
        const scssFilePath = `${webHelpers.pagesStylesDir}/${response.pageName}.scss`;
        console.log("creating SCSS file\n", chalk.blue(scssFilePath), "\n");

        const data =  await fs.readFile(templateFile, 'utf8');
        await fs.writeFile(scssFilePath, data);
        return;
    }

    async start(): Promise<any> {
        // const db = app.firestore();
        console.log(chalk.green('Let\'s create a static page.'));
        const response = await prompts(this.getQuestions());
        this.response = response;
        const {pagePath, title, looksGood} = response;



        if (!looksGood) {
            console.warn(chalk.red("Not creating pages."));
            return;
        }

        console.log("page path is: ", pagePath);
        console.log("title ", title);

        const fileTasks = [];
        fileTasks.push(
            CreatePage.createHtml(response),
            CreatePage.createJS(response),
            CreatePage.createScss(response),
            CreatePage.addToSitemap(response)
        );


        if (response.writeUrls) {
            fileTasks.push(
                CreatePage.updateFirebaseJson(response),
                CreatePage.updatePagesFile(response)
            );
        } else {
            console.log("Not writing urls to pages.js or firebase.json");
        }

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
            mailchimpCommand.contentUrl = response.pagePath;
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

            await firestoreCommand.start();
        }

        return;
    }
}
