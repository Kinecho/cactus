import chalk from "chalk";
import {Command} from "@scripts/run";


const prompts = require('prompts');
const helpers = require("@web/../helpers");
const fs = require("fs");
const path = require("path");

const firebaseConfigPath = `${helpers.projectRoot}/firebase.json`;
const pagesPath = `${helpers.webRoot}/pages.js`;
const pages = require(pagesPath) as { [name: string]: { title: string, path: string } };

console.log('Let\'s create a static page.');

const questions = [
    {
        type: "text",
        name: 'title',
        message: 'Question',
    },
    {
        type: "text",
        name: 'pageName',
        message: 'File Name (without the extension)',
        initial: (prev: any, values: any) => formatFilename(values.title),
        validate: validatePageName,
        format: formatFilename,
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
 • ${helpers.htmlDir}/${values.pageName}.html
 • ${helpers.pagesStylesDir}/${values.pageName}.ts
 • ${helpers.pagesScriptsDir}/${values.pageName}.scss 
${values.pagePath ? `${chalk.blue("Files to update")}: \n • ${helpers.webRoot}/pages.js \n • ${helpers.projectRoot}/firebase.json` : ''}
 
All Good?`
    },
];


export interface InputResponse {
    pageName: string,
    title: string,
    pagePath: string,
    writeUrls: boolean,
    looksGood: boolean,
}

let response: InputResponse;


function getFirebaseConfig(): { hosting: { rewrites: { source: string, destination: string }[] } } {
    return require(`${helpers.projectRoot}/firebase.json`);
}

export function formatFilename(value: string) {
    return getFilenameFromInput(value);
}

export function validatePageName(input: string): boolean | string {
    const htmlName = getFilenameFromInput(input, "html");
    const htmlExists = fs.existsSync(path.join(`${helpers.htmlDir}`, htmlName));
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

export function getFilenameFromInput(input: string, extension: string | undefined = undefined): string {
    const name = removeSpecialCharacters(input, "_");
    if (extension) {
        return `${name}.${extension}`;
    } else {
        return name;
    }
}

export function getUrlFromInput(input: string|null): string {
    let toProcess = input;

    if (!toProcess) {
        return "";
    }

    if (toProcess && toProcess.indexOf("/") === 0) {
        toProcess = toProcess.slice(1);
    }

    const name = removeSpecialCharacters(toProcess, "-");
    if (!name.startsWith("/")) {
        return `/${name}`;
    }
    return name;
}

export function removeSpecialCharacters(input: string, replacement: string): string {
    return input.trim().toLowerCase()
        .replace(/[^a-z0-9-_\s\\\/]/g, "") //remove special characters
        .replace(/[-_\\\/]/g, " ") //replace underscores or hyphens with space
        .replace(/(\s+)/g, replacement); //replace all spaces with hyphen
}

function updateFirebaseJson() {
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

    //TODO: actually write to file;
    console.log("Adding page to Firebase Config:\n", chalk.yellow(JSON.stringify(newPage, null, 4)));
    fs.writeFile(firebaseConfigPath, JSON.stringify(config, null, 4), 'utf8', (err: any) => {
        if (err) {
            console.log(err);
        }
    });
}

function updatePagesFile() {
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


    fs.writeFile(pagesPath, data, 'utf8', (err: any) => {
        if (err) {
            console.log(err);
        }
    });
}

function createHtml() {
    const htmlOutputPath = `${helpers.htmlDir}/${response.pageName}.html`;
    const templateFile = path.resolve(helpers.srcDir, "templates", "page.html");
    console.log("creating HTML from template\n", chalk.blue(htmlOutputPath), "\n");

    fs.readFile(templateFile, 'utf8', function (err: any, data: any) {
        if (err) {
            console.log(err);
        }
        const content = data.replace(/\$PAGE_TITLE\$/g, response.title);

        fs.writeFile(htmlOutputPath, content, 'utf8', (e: any) => {
            if (e) {
                console.log(e);
            }
        });

    });
}

function addToSitemap() {
    const sitemapFile = path.resolve(helpers.projectRoot, "web", "src", "assets", "sitemaps", "questions.txt");
    console.log("appending new page URL to Questions Sitemap\n");

    const newUrl = "\n" + "https://cactus.app" + response.pagePath;

    fs.appendFile(sitemapFile, newUrl, 'utf8', (err: any) => {
        if (err) {
            console.log(err);
        }
    });
}

function createJS() {
    const outputFilePath = `${helpers.pagesScriptsDir}/${response.pageName}.ts`;
    // console.log("creating js file with response = ", response);
    console.log("creating javascript file from template:\n", chalk.blue(outputFilePath), "\n");

    const templateFile = path.resolve(helpers.srcDir, "templates", "page_script.ts");

    fs.readFile(templateFile, 'utf8', (err: any, data: any) => {
        if (err) {
            console.log(err);
        }
        const content = data.replace(/\$PAGE_NAME\$/g, response.pageName);

        fs.writeFile(outputFilePath, content, 'utf8', (e: any) => {
            if (e) {
                console.log(e);
            }
        });
    });
}

function createScss() {
    const templateFile = path.resolve(helpers.srcDir, "templates", "page_style.scss");
    const scssFilePath = `${helpers.pagesStylesDir}/${response.pageName}.scss`;
    console.log("creating SCSS file\n", chalk.blue(scssFilePath), "\n");

    fs.readFile(templateFile, 'utf8', (err: any, data: any) => {
        if (err) {
            console.log(err);
        }

        fs.writeFile(scssFilePath, data, 'utf8', (e: any) => {
            if (e) {
                console.log(e);
            }
        });

    });
}

// export async function start(): Promise<void> {
//     response = await prompts(questions);
//     const {pagePath, title, looksGood} = response;
//
//     if (!looksGood) {
//         console.warn("Not creating pages.");
//         return;
//     }
//
//     console.log("page path is: ", pagePath);
//     console.log("title ", title);
//
//     createHtml();
//     createJS();
//     createScss();
//     addToSitemap();
//
//
//     if (response.writeUrls) {
//         updateFirebaseJson();
//         updatePagesFile();
//     } else {
//         console.log("Not writing urls to pages.js or firebase.json");
//     }
//
// }

//
// start().then(() => {
//     console.log("Done")
// }).catch(error => {
//     console.error("Failed to create page", error);
// });
//



export default class CreatePage implements Command {
    name = "Create Page";

    async start(): Promise<any> {
        // const db = app.firestore();

        response = await prompts(questions);
        const {pagePath, title, looksGood} = response;

        if (!looksGood) {
            console.warn(chalk.red("Not creating pages."));
            return;
        }

        console.log("page path is: ", pagePath);
        console.log("title ", title);

        createHtml();
        createJS();
        createScss();
        addToSitemap();


        if (response.writeUrls) {
            updateFirebaseJson();
            updatePagesFile();
        } else {
            console.log("Not writing urls to pages.js or firebase.json");
        }


        return;
    }
}
