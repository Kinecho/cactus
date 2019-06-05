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

async function listAllPageNames():Promise<string[]>{
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

function updateFirebaseJson() {
    let config = getFirebaseConfig();
    let rewrites = config.hosting.rewrites;


    let foundPage = rewrites.find(page => page.destination === response.pageName);

    if (foundPage){
        console.log("No page found in firebase config with name", response.pageName);
        return
    }


    const updated = rewrites.filter(page => page.destination === `${response.pageName}.html`);
    config.hosting.rewrites = updated;

    console.log("Removing page to Firebase Config:\n", chalk.yellow(JSON.stringify(foundPage, null, 4)));
    fs.writeFile(firebaseConfigPath, JSON.stringify(config, null, 4), 'utf8', function (err) {
        if (err) return console.log(err);
    });
}

function updatePagesFile() {
    let existingPgae = pages[response.pageName];
    if (!existingPgae) {
        console.warn(`No page with name ${response.pageName} exists in pages.js`);
    }

    delete pages[response.pageName];

    console.log("\nRemoving page from pages.js:\n", chalk.yellow(JSON.stringify(existingPgae, null, 4)));

    let data = `module.exports = ${JSON.stringify(pages, null, 4)}`;


    fs.writeFile(pagesPath, data, 'utf8', function (err) {
        if (err) return console.log(err);
    });
}

function removeHtml() {
    let htmlPath = `${helpers.htmlDir}/${response.pageName}.html`;
    console.log("removing HTML", chalk.blue(htmlPath));
    fs.unlinkSync(htmlPath);
}

function removeJS() {
    let tsPath = `${helpers.pagesScriptsDir}/${response.pageName}.ts`;
    console.log("removing TS file", chalk.blue(tsPath));
    fs.unlinkSync(tsPath)
    // console.log("creating js file with response = ", response);


}

function removeScss() {

    let scssFilePath = `${helpers.pagesStylesDir}/${response.pageName}.scss`;
    console.log("removingi SCSS file\n", chalk.blue(scssFilePath), "\n");

    fs.unlinkSync(scssFilePath);
}

async function start(): Promise<void> {
    // console.log("Reading files...");
    let files = (await listAllPageNames()).map(file => ({title: file}));
    // console.log("files", files);


    const questions = [
        {
            type: "autocomplete",
            name: 'pageName',
            message: 'File Name (without the extension)',
            // initial: (prev, values) => formatFilename(values.title),
            validate: validatePageExists,
            // format: formatFilename,
            choices: files,
            limit: 3,
        },
    ];


    response = await prompts(questions);
    const {pageName} = response;

    console.log("removing page", chalk.red(pageName));

    // re

    removeHtml();
    removeJS();
    removeScss();
    updatePagesFile();
    updateFirebaseJson();

    //
    // createHtml();
    // createJS();
    // createScss();
    //
    //
    // if (response.writeUrls) {
    //     updateFirebaseJson();
    //     updatePagesFile();
    // } else {
    //     console.log("Not writing urls to pages.js or firebase.json");
    // }

}


start().then(() => {
    console.log("Done")
}).catch(error => {
    console.error("Failed to create page", error);
});

