import {file} from "@babel/types";
import chalk from "chalk";

const prompts = require('prompts');
const helpers = require("./helpers");
const fs = require("fs");
import {promisify} from "util";

const path = require("path");

const firebaseConfigPath = `${helpers.projectRoot}/firebase.json`;
const pagesPath = `${helpers.webRoot}/pages.js`;
const pages = require(pagesPath) as { [name: string]: { title: string, path: string } };

console.log(chalk.red("Let's remove a page."));

export interface InputResponse {
    pageName: string,
}

let response: InputResponse;

function getFirebaseConfig(): { hosting: { rewrites: { source: string, destination: string }[] } } {
    return require(`${helpers.projectRoot}/firebase.json`);
}

async function listAllPageNames(): Promise<string[]> {
    let files = await promisify(fs.readdir)(helpers.htmlDir);

    const fileNames = [];
    files.forEach(file => {
        fileNames.push(file.replace(".html", ""));
    });

    return fileNames;
}

export function validatePageExists(input): boolean | string {
    // let htmlName = getFilenameFromInput(input, "html");
    let baseName = input.split(".")[0];
    let htmlExists = fs.existsSync(path.join(`${helpers.htmlDir}`, baseName));
    let pagesExists = !!pages[baseName];

    if (htmlExists || pagesExists) {
        return true;
    }

    return `Unable to find this page. Please pick a new value`;
}

async function updateFirebaseJson() {
    let config = getFirebaseConfig();
    let rewrites = config.hosting.rewrites;

    let htmlName = `${response.pageName}.html`;

    if (!htmlName.startsWith("/")) {
        htmlName = `/${htmlName}`;
    }

    let foundPage = rewrites.find((page) => page.destination === htmlName);

    if (!foundPage) {
        console.log("No page found in firebase config with name", htmlName);
        return
    }

    // console.log("Removing page to Firebase Config:\n", chalk.yellow(JSON.stringify(foundPage, null, 4)));
    // prompts.a

    const {remove} = await prompts({
        name: "remove",
        message: `Remove from firebase config? \n ${chalk.yellow(JSON.stringify(foundPage, null, 2))}`,
        type: "confirm"
    });

    if (remove) {
        config.hosting.rewrites = rewrites.filter((page) => page.destination !== htmlName);

        fs.writeFile(firebaseConfigPath, JSON.stringify(config, null, 4), 'utf8', function (err) {
            if (err) return console.log(err);
        });
        console.log(chalk.green("Removed config from firebase.json"))
    } else {
        console.log("Skipping firebase.json");
    }
}

async function updatePagesFile() {
    let existingPage = pages[response.pageName];
    if (!existingPage) {
        console.warn(`No page with name ${response.pageName} exists in pages.js`);
    }


    const {remove} = await prompts({
        name: "remove",
        message: `Remove configuration from pages.js? \n${chalk.yellow(JSON.stringify(existingPage, null, 4))}`,
        type: "confirm"
    });

    if (!remove) {
        console.log("Not updating pages.js configuration");
        return
    }

    delete pages[response.pageName];

    // console.log("Removing page from pages.js:\n", chalk.yellow(JSON.stringify(existingPage, null, 4)));

    let data = `module.exports = ${JSON.stringify(pages, null, 4)}`;

    fs.writeFile(pagesPath, data, 'utf8', function (err) {
        if (err) {
            return console.log(err)
        }
    });
    console.log(chalk.green("Removed configuration from pages.js"));
}

async function removeHtml() {
    let htmlPath = `${helpers.htmlDir}/${response.pageName}.html`;

    const {remove} = await prompts({
        name: "remove",
        message: `Remove ${htmlPath}?`,
        type: "confirm"
    });

    if (!remove) {
        console.log("Skipping html file");
        return;
    }


    console.log(chalk.green("removing HTML"));
    fs.unlinkSync(htmlPath);
}

async function removeJS() {
    let tsPath = `${helpers.pagesScriptsDir}/${response.pageName}.ts`;

    const {remove} = await prompts({
        name: "remove",
        message: `Remove ${tsPath}?`,
        type: "confirm"
    });

    if (!remove) {
        console.log("Skipping ts file");
        return;
    }


    console.log(chalk.green("removing TS file"));
    fs.unlinkSync(tsPath)
    // console.log("creating js file with response = ", response);


}

async function removeScss() {
    let scssFilePath = `${helpers.pagesStylesDir}/${response.pageName}.scss`;
    const {remove} = await prompts({
        name: "remove",
        message: `Remove ${scssFilePath}?`,
        type: "confirm"
    });

    if (!remove) {
        console.log("Skipping scss file");
        return;
    }

    console.log(chalk.green("removing SCSS file"));
    fs.unlinkSync(scssFilePath);
}

async function start(): Promise<void> {
    console.log("Loading pages...");
    let files = (await listAllPageNames()).map(file => ({title: file}));
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
            limit: 20,
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

        await updatePagesFile();
        await updateFirebaseJson();
        await removeJS();
        await removeScss();
        await removeHtml();
    } else {
        console.log("cancel success");
    }
}


start().then(() => {
    console.log("Done")
}).catch(error => {
    console.error("Failed to create page", error);
});

