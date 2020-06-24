import * as chalk from "chalk";
import {promisify} from "util";
import {getFilenameFromInput} from "@shared/util/StringUtil";
import {InputResponse} from "@scripts/commands/CreateLandingPage";

const fs = require("fs");
const path = require("path");
const webHelpers = require("@web/../helpers");
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const appendFile = promisify(fs.appendFile);
const pagesPath = `${webHelpers.webRoot}/pages.js`;

export interface PageEntry {
    path?: string,
    title: string,
    name: string,
    includeInDev?: boolean,
    reflectionPrompt?: boolean,
    indexPath?: boolean,
}

const pages = require(pagesPath) as { [name: string]: PageEntry };

const firebaseConfigPath = `${webHelpers.projectRoot}/firebase.json`;

export interface PageConfig {
    pageName: string,
    title: string,
    pagePath: string,
    indexPath?: boolean,
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


export interface FirebaseConfig {
    hosting: { rewrites: { source: string, destination: string }[] }
}

export function getFirebaseConfig(): FirebaseConfig {
    return require(`${webHelpers.projectRoot}/firebase.json`);
}

export async function updateFirebaseJson(response: PageConfig): Promise<void> {
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

    console.log("Adding page to Firebase Config", chalk.yellow(newPage.source));

    await writeFile(firebaseConfigPath, JSON.stringify(config, null, 4), {encoding: 'utf8'});
    return;
}

export async function updatePagesFile(response: PageConfig): Promise<void> {
    if (pages[response.pageName]) {
        console.warn("A Page with the same key already exists in pages.js");
    }
    const newPage: PageEntry = {
        title: response.title,
        path: response.pagePath,
        name: response.pageName,
    };

    pages[response.pageName] = newPage;

    console.log("Adding new page to pages.js:", chalk.yellow(newPage.path || ""));

    const data = `module.exports = ${JSON.stringify(pages, null, 4)}`;

    return writeFile(pagesPath, data, {encoding: 'utf8'});
}

export async function createHtml(response: PageConfig): Promise<void> {
    const htmlOutputPath = `${webHelpers.htmlDir}/${response.pageName}.html`;
    const templateFile = path.resolve(webHelpers.srcDir, "templates", "page.html");
    console.log("creating HTML from template\n", chalk.blue(htmlOutputPath), "\n");


    const data = await readFile(templateFile, {encoding: 'utf8'});
    const content = data.replace(/\$PAGE_TITLE\$/g, response.title);
    await writeFile(htmlOutputPath, content, {encoding: 'utf8'});
    return;
}

export async function addToSitemap(response: PageConfig): Promise<void> {
    const sitemapFile = webHelpers.questionsSiteMap;
    console.log("appending new page URL to Questions Sitemap\n");

    const newUrl = "\n" + "https://cactus.app" + response.pagePath;

    await appendFile(sitemapFile, newUrl, {encoding: 'utf8'});
    return;
}

export async function createJS(response: InputResponse): Promise<void> {
    const outputFilePath = `${webHelpers.pagesScriptsDir}/${response.pageName}.ts`;
    console.log("creating javascript file from template:\n", chalk.blue(outputFilePath), "\n");

    const templateFileName = response.createVueComponent ? "page_component_template.ts" : "page_script.ts";
    const templateFile = path.resolve(webHelpers.srcDir, "templates", templateFileName);

    const data = await readFile(templateFile, {encoding: 'utf8'});
    const content = data.replace(/\$PAGE_NAME\$/g, response.pageName).replace(/\$COMPONENT\$/g, response.componentName);

    await writeFile(outputFilePath, content, 'utf8');
    return;
}


export async function createVueComponent(response: InputResponse): Promise<void> {
    const outputFilePath = `${webHelpers.componentsDir}/${response.componentName}.vue`;
// console.log("creating js file with response = ", response);
    console.log("creating vue file from template:\n", chalk.blue(outputFilePath), "\n");

    const templateFile = path.resolve(webHelpers.srcDir, "templates", "component_template.vue");

    const data = await readFile(templateFile, {encoding: 'utf8'});
    // const content = data.replace(/\$PAGE_NAME\$/g, response.pageName);

    await writeFile(outputFilePath, data, 'utf8');
    return;

}

/**
 * @Deprecated
 * This is no longer used
 * @param {PageConfig} response
 * @return {Promise<void>}
 */
export async function createScss(response: PageConfig): Promise<void> {
    //We don't use this anymore
    // const templateFile = path.resolve(webHelpers.srcDir, "templates", "page_style.scss");
    // const scssFilePath = `${webHelpers.pagesStylesDir}/${response.pageName}.scss`;
    // console.log("creating SCSS file\n", chalk.blue(scssFilePath), "\n");
    //
    // const data = await readFile(templateFile, {encoding: 'utf8'});
    // await writeFile(scssFilePath, data);
    return;
}