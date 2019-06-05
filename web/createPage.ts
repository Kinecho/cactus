import {file} from "@babel/types";
import chalk from "chalk";

const prompts = require('prompts');
const helpers = require("./helpers");
const fs = require("fs");
const path = require("path");

const firebaseConfigPath = `${helpers.projectRoot}/firebase.json`;
const pagesPath = `${helpers.webRoot}/pages.js`;
const pages = require(pagesPath) as { [name: string]: { title: string, path: string } };

console.log('Let\'s create a static page.');

export interface InputResponse {
    pageName: string,
    title: string,
    pagePath: string,
    writeUrls: boolean,
    looksGood: boolean,
}

let response: InputResponse;

const questions = [
    {
        type: "text",
        name: 'title',
        message: 'What is the title of this page?',
    },
    {
        type: "text",
        name: 'pageName',
        message: 'What should we name the files? Don\'t include a file extension.',
        initial: (prev, values) => formatFilename(values.title),
        validate: validatePageName,
        format: formatFilename,
    },
    {
        type: "confirm",
        name: "writeUrls",
        message: `Do you want to register a URL for this page?`
    },
    {
        type: prev => prev === true ? 'text' : null,
        name: 'pagePath',
        message: 'What is the path (url) for this page?',
        initial: (prev, values) => getUrlFromInput(values.title),
        validate: value => validateUrl(value),
        format: value => getUrlFromInput(value)
    },
    {
        type: "confirm",
        name: "looksGood",
        message: (prev, values) => `Here's the current configuration:
        
${chalk.blue("title")}: \t${values.title}
${chalk.blue("path")}: ${values.pagePath || "<none>"}
${chalk.blue("filenames")}: 
 • ${helpers.htmlDir}/${values.pageName}.html
 • ${helpers.pagesStylesDir}/${values.pageName}.ts
 • ${helpers.pagesScriptsDir}/${values.pageName}.scss 
 
Continue with creating files?`
    },
];


function getFirebaseConfig(): { hosting: { rewrites: { source: string, destination: string }[] } } {
    return require(`${helpers.projectRoot}/firebase.json`);
}

export function formatFilename(value: string) {
    let filename = getFilenameFromInput(value);
    return filename;
}

export function validatePageName(input): boolean | string {
    let htmlName = getFilenameFromInput(input, "html");
    let htmlExists = fs.existsSync(path.join(`${helpers.htmlDir}`, htmlName));
    let pagesExists = !!pages[htmlName];

    if (!htmlExists && !pagesExists) {
        return true;
    }

    return `A page with this name already exists. Please pick a new value`;
}

export function validateUrl(input): boolean | string {
    let firebaseUrl = getFirebaseConfig().hosting.rewrites.find(rewrite => rewrite.source === input);
    let pagesUrl = Object.values(pages).find(page => page.path === input);

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

export function getUrlFromInput(input: string): string {
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
    let config = getFirebaseConfig();
    let rewrites = config.hosting.rewrites;

    let newPage = {
        source: `${response.pagePath}`,
        destination: `/${response.pageName}.html`
    };


    let existing = rewrites.find(page => page.source === newPage.source || page.destination === newPage.source);
    if (existing) {
        console.warn("A page with the same source or destination was found in firebase.json");
        console.warn("NOT UPDATING FIREBASE.JSON");
        return;
    }

    rewrites.unshift(newPage);

    //TODO: actually write to file;
    console.log("Adding page to Firebase Config:\n", chalk.yellow(JSON.stringify(newPage, null, 4)))
    fs.writeFile(firebaseConfigPath, JSON.stringify(config, null, 4), 'utf8', function (err) {
        if (err) return console.log(err);
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

    console.log("Adding new page to pages.js", chalk.yellow(JSON.stringify(newPage, null, 4)));

    let data = `module.exports = ${JSON.stringify(pages, null, 4)}`;


    fs.writeFile(pagesPath, data, 'utf8', function (err) {
        if (err) return console.log(err);
    });
}

function createHtml() {
    let htmlOutputPath = `${helpers.htmlDir}/${response.pageName}.html`;
    let templateFile = path.resolve(helpers.srcDir, "templates", "page.html");
    console.log("creating HTML from template\n", chalk.blue(htmlOutputPath), "\n");

    fs.readFile(templateFile, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        const content = data.replace(/\$PAGE_TITLE\$/g, response.title);

        fs.writeFile(htmlOutputPath, content, 'utf8', function (err) {
            if (err) return console.log(err);
        });

    });
}

function createJS() {
    let outputFilePath = `${helpers.pagesScriptsDir}/${response.pageName}.ts`;
    // console.log("creating js file with response = ", response);
    console.log("creating javascript file from template:\n", chalk.blue(outputFilePath), "\n");

    let templateFile = path.resolve(helpers.srcDir, "templates", "page_script.js");

    fs.readFile(templateFile, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        const content = data.replace(/\$PAGE_NAME\$/g, response.pageName);

        fs.writeFile(outputFilePath, content, 'utf8', function (err) {
            if (err) return console.log(err);
        });

    });
}

function createScss() {
    let templateFile = path.resolve(helpers.srcDir, "templates", "page_style.scss");
    let scssFilePath = `${helpers.pagesStylesDir}/${response.pageName}.scss`;
    console.log("creating SCSS file\n", chalk.blue(scssFilePath), "\n");

    fs.readFile(templateFile, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        const content = data;


        fs.writeFile(scssFilePath, content, 'utf8', function (err) {
            if (err) return console.log(err);
        });

    });
}

async function start(): Promise<void> {
    response = await prompts(questions);
    const {pageName, pagePath, title} = response;

    if (!response.looksGood) {
        console.warn("Not creating pages... exiting");
        return;
    }

    console.log("page path is: ", pagePath);
    console.log("title ", title);


    if (response.pagePath && !response.pagePath.startsWith("/")) {
        response.pagePath = `/${response.pagePath}`;
    }


    createHtml();
    createJS();
    createScss();


    if (response.writeUrls) {
        updateFirebaseJson();
        updatePagesFile();
    } else {
        console.log("Not writing urls to pages.js or firebase.json");
    }

}


start().then(() => {
    console.log("Finished creating page")
}).catch(error => {
    console.error("Failed to create page", error);
});

