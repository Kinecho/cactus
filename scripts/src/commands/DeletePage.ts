import chalk from "chalk";
const prompts = require('prompts');
const helpers = require("@web/../helpers");
const fs = require("fs");
import {promisify} from "util";
import {Command} from "@scripts/CommandTypes";

const path = require("path");

interface PageFileEntry{
    title: string,
    path: string,
}

const firebaseConfigPath = `${helpers.projectRoot}/firebase.json`;
const pagesPath = `${helpers.webRoot}/pages.js`;
const pages = require(pagesPath) as { [name: string]: PageFileEntry };

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
export interface InputResponse {
    pageName: string,
}

let response: InputResponse;

function getFirebaseConfig(): { hosting: { rewrites: { source: string, destination: string }[] } } {
    return require(`${helpers.projectRoot}/firebase.json`);
}

async function listAllPageNames(): Promise<string[]> {
    const files = await promisify(fs.readdir)(helpers.htmlDir);

    const fileNames:string[] = [];
    files.forEach((file:string) => {
        fileNames.push(file.replace(".html", ""));
    });

    return fileNames;
}

export function validatePageExists(input:string): boolean | string {
    const baseName = input.split(".")[0];
    const htmlExists = fs.existsSync(path.join(`${helpers.htmlDir}`, baseName));
    const pagesExists = !!pages[baseName];

    if (htmlExists || pagesExists) {
        return true;
    }

    return `Unable to find this page. Please pick a new value`;
}

async function updateFirebaseJson() {
    const config = getFirebaseConfig();
    const rewrites = config.hosting.rewrites;

    let htmlName = `${response.pageName}.html`;

    if (!htmlName.startsWith("/")) {
        htmlName = `/${htmlName}`;
    }

    const foundPage = rewrites.find((page) => page.destination === htmlName);

    if (!foundPage) {
        console.log("No page found in firebase config with name", htmlName);
        return
    }

    const {remove} = await prompts({
        name: "remove",
        message: `Remove from firebase config? ${chalk.yellow(JSON.stringify(foundPage))}`,
        type: "confirm"
    });

    if (remove) {
        config.hosting.rewrites = rewrites.filter((page) => page.destination !== htmlName);

        await writeFile(firebaseConfigPath, JSON.stringify(config, null, 4), {encoding: 'utf8'});
        // console.log(chalk.green("Removed config from firebase.json"))
    } else {
        console.log("Skipping firebase.json");
    }
}


async function updatePagesFile():Promise<PageFileEntry|null> {
    const existingPage = pages[response.pageName];
    if (!existingPage) {
        console.warn(`No page with name ${response.pageName} exists in pages.js`);
    }

    const {remove} = await prompts({
        name: "remove",
        message: `Remove configuration from pages.js? ${chalk.yellow(JSON.stringify(existingPage))}`,
        type: "confirm"
    });

    if (!remove) {
        console.log("Not updating pages.js configuration");
        return null;
    }

    delete pages[response.pageName];

    const data = `module.exports = ${JSON.stringify(pages, null, 4)}`;

    await writeFile(pagesPath, data, {encoding: 'utf8'});
    // console.log(chalk.green("Removed configuration from pages.js"));
    return existingPage;
}

async function removeHtml() {
    const htmlPath = `${helpers.htmlDir}/${response.pageName}.html`;

    const {remove} = await prompts({
        name: "remove",
        message: `Remove ${htmlPath}?`,
        type: "confirm"
    });

    if (!remove) {
        console.log("Skipping html file");
        return;
    }

    // console.log(chalk.green("removing HTML"));
    fs.unlinkSync(htmlPath);
}

async function removeJS() {
    const tsPath = `${helpers.pagesScriptsDir}/${response.pageName}.ts`;

    const {remove} = await prompts({
        name: "remove",
        message: `Remove ${tsPath}?`,
        type: "confirm"
    });

    if (!remove) {
        console.log("Skipping ts file");
        return;
    }

    // console.log(chalk.green("removing TS file"));
    fs.unlinkSync(tsPath)
}

async function removeScss() {
    const scssFilePath = `${helpers.pagesStylesDir}/${response.pageName}.scss`;
    const {remove} = await prompts({
        name: "remove",
        message: `Remove ${scssFilePath}?`,
        type: "confirm"
    });

    if (!remove) {
        console.log("Skipping scss file");
        return;
    }

    // console.log(chalk.green("removing SCSS file"));
    fs.unlinkSync(scssFilePath);
}

async function removeFromSitemap(pageEntry:PageFileEntry|null){

    if (!pageEntry){
        console.warn("No page entry found - unable to remove from sitemap");
        return;
    }

    // console.log("removing entry for page path", JSON.stringify(pageEntry));

    const sitemap = await readFile(helpers.questionsSiteMap, {encoding: 'utf8'});

    const urls = sitemap.split("\n");
    const filteredUrls = urls.filter((url:string) => !url.includes(pageEntry.path));

    if (filteredUrls.length === urls.length) {
        console.log("No entry found in sitemap for url", pageEntry.path);
        return
    }

    const {remove} = await prompts({
        name: "remove",
        message: `Remove ${pageEntry.path} from questions sitemap?`,
        type: "confirm"
    });

    if (remove) {

        await promisify(fs.writeFile)(helpers.questionsSiteMap, filteredUrls.join("\n"), 'utf8');
        // console.log(chalk.green("Removed entry from sitemap"))
    } else {
        console.log("Skipping sitemap");
    }
}

export default class DeletePage implements Command {
    name = "Delete A Page";
    description = "Removes the files and config entries for a web page";
    showInList = true;


    async start(): Promise<void> {
        console.log(chalk.red("Let's remove a page.\n"));

        const files = (await listAllPageNames()).map(file => ({title: file}));
        let canceled = false;
        const questions = [
            {
                type: "autocomplete",
                name: 'pageName',
                message: 'Page (type to filter)',
                // initial: (prev, values) => formatFilename(values.title),
                validate: validatePageExists,
                // format: formatFilename,
                choices: files,
                limit: 10,
            },
        ];

        response = await prompts(questions, {
            onCancel: () => {
                console.log("Canceled deletion");
                canceled = true;
            }
        });

        if (!canceled){
            const {pageName} = response;
            console.log("removing page", chalk.red(pageName));

            const pageEntry = await updatePagesFile();
            await updateFirebaseJson();
            await removeJS();
            await removeScss();
            await removeHtml();
            await removeFromSitemap(pageEntry);
        } else {
            console.log("cancel success");
        }
    }
}