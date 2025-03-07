import * as chalk from "chalk";
import {getFilenameFromInput, getUrlFromInput} from "@shared/util/StringUtil";
const prompts = require('prompts');
import helpers from "@scripts/helpers";

const webHelpers = helpers.webHelpers;

import {
    addToSitemap,
    createHtml,
    createJS, createVueComponent,
    PageConfig,
    updateFirebaseJson,
    updatePagesFile, validatePageName, validateUrl
} from "@scripts/util/CreatePageUtil";
import {resetConsole} from "@scripts/util/ConsoleUtil";
import {Command} from "@scripts/CommandTypes";

export interface InputResponse extends PageConfig {
    pageName: string,
    title: string,
    pagePath: string,
    writeUrls: boolean,
    addToSitemap: boolean,
    createVueComponent: boolean,
    componentName?: string,
    looksGood: boolean,
}

export default class CreateLandingPage implements Command {
    name = "Pages: Create Landing Page";
    response?: InputResponse;
    description = "Creates a standalone webpage";
    showInList = true;

    getQuestions():any[]{
        return [
            {
                type: "text",
                name: 'title',
                message: 'Page Title',
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
                name: "addToSitemap",
                message: "Add to sitemap?"
            },
            {
                type: "confirm",
                name: "createVueComponent",
                message: "Create a Vue Component?"
            },
            {
                type: (prev: boolean) => prev ? "text" : null,
                name: "componentName",
                message: "Vue Component Name",
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
        console.log(chalk.green(`Let\'s create a landing page.`));
        console.log(chalk.dim(`This will not create any email campaigns or add anything to the database.`));
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
            // createScss(response),
            updateFirebaseJson(response),
            updatePagesFile(response)
        ];

        if (response.addToSitemap) {
            fileTasks.push(addToSitemap(response))
        }

        if (response.createVueComponent) {
            fileTasks.push(createVueComponent(response))
        }

        await Promise.all(fileTasks);
        console.log("Your page has been created. Be sure to add the new files to git!");
        return;
    }
}
