const prompts = require('prompts');
const helpers = require("./helpers");
const fs = require("fs");
const path = require("path");

const firebaseConfigPath = `${helpers.projectRoot}/firebase.json`;
const pagesPath = `${helpers.webRoot}/pages.js`;
const pages = require(pagesPath) as {[name: string]: {title:string, path:string}};

console.log('Let\'s create a static page.');

const doWrite = true;

export interface InputResponse {
    pageName: string,
    title: string,
    pagePath: string,
}

let response:InputResponse;

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
        initial: getInitialPageName,
        validate: validatePageName
    },
    {
        type: 'text',
        name: 'pagePath',
        message: 'What is the path (url) for this page?',
        initial: getUrlFromInput,
        validate: validateUrl,
    },
];


function getFirebaseConfig():{hosting: {rewrites: {source:string, destination:string}[]}}{
    return require(`${helpers.projectRoot}/firebase.json`);
}

export function getInitialPageName(prev:string, values:any){
    console.log("Creating page:", prev);
    return getFilenameFromInput(prev)
}

export function validatePageName(input):boolean|string{
    let htmlName = getFilenameFromInput(input, "html");
    let htmlExists = fs.existsSync(path.join(`${helpers.htmlDir}`, htmlName));
    let pagesExists = !!pages[htmlName];

    if (!htmlExists && !pagesExists){
        return true;
    }

    return `A page with this name already exists. Please pick a new value`;
}

export function validateUrl(input):boolean|string{
    let firebaseUrl = getFirebaseConfig().hosting.rewrites.find(rewrite => rewrite.source === input);
    let pagesUrl = Object.values(pages).find(page => page.path === input);

    if (!firebaseUrl && !pagesUrl){
        return true;
    }

    return `This URL is already mapped. Please choose a new URL.`;
}

export function getFilenameFromInput(input:string, extension:string|undefined=undefined):string{
    const name = removeSpecialCharacters(input, "_");
    if (extension){
        return `${name}.${extension}`;
    } else {
        return name;
    }
}

export function getUrlFromInput(input:string):string{
    const name = removeSpecialCharacters(input, "-");
    if (!name.startsWith("/")){
        return `/${name}`;
    }
    return name;
}

export function removeSpecialCharacters(input:string, replacement:string):string {
    return input.trim().toLowerCase()
        .replace(/[^a-z0-9-_\s\\\/]/g, "") //remove special characters
        .replace(/[-_\\\/]/g, " ") //replace underscores or hyphens with space
        .replace(/(\s+)/g, replacement); //replace all spaces with hyphen
}

function updateFirebaseJson(){
    let config = getFirebaseConfig();
    let rewrites = config.hosting.rewrites;

    let newPage = {
        source: `${response.pagePath}`,
        destination: `${response.pageName}.html`
    };


    let existing = rewrites.find(page => page.source === newPage.source || page.destination === newPage.source);
    if (existing){
        console.warn("A page with the same source or destination was found in firebase.json");
        console.warn("NOT UPDATING FIREBASE.JSON");
        return;
    }

    rewrites.unshift(newPage);

    console.log("Adding page to Firebase Config", JSON.stringify(newPage, null, 4));

    //TODO: actually write to file;

    if (doWrite){
        fs.writeFile(firebaseConfigPath, JSON.stringify(config, null, 4), 'utf8', function (err) {
            if (err) return console.log(err);
        });
    }
}

function updatePagesFile(){
    if (pages[response.pageName]) {
        console.warn("A Page with the same key already exists in pages.js");
    }
    const newPage = {
        title: response.title,
        path: response.pagePath,
    };

    pages[response.pageName] = newPage;

    console.log("Adding new page to pages.js", JSON.stringify(newPage, null, 4));

    let data = `module.exports = ${JSON.stringify(pages, null, 4)}`;

    if (doWrite){
        fs.writeFile(pagesPath, data, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    }
}

function createHtml() {
    let htmlOutputPath = `${helpers.htmlDir}/${response.pageName}.html`;
    let templateFile = path.resolve(helpers.srcDir, "templates", "page.html");
    console.log("creating HTML from template", htmlOutputPath);

    fs.readFile(templateFile, 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        const content = data.replace(/\$PAGE_TITLE\$/g, response.title );

        if (doWrite){
            fs.writeFile(htmlOutputPath, content, 'utf8', function (err) {
                if (err) return console.log(err);
            });
        }
    });
}

function createJS() {
    let outputFilePath = `${helpers.pagesScriptsDir}/${response.pageName}.ts`;
    // console.log("creating js file with response = ", response);
    console.log("creating javascript file from template", outputFilePath);

    let templateFile = path.resolve(helpers.srcDir, "templates", "page_script.js");

    fs.readFile(templateFile, 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        const content = data.replace(/\$PAGE_NAME\$/g, response.pageName );

        if (doWrite){
            fs.writeFile(outputFilePath, content, 'utf8', function (err) {
                if (err) return console.log(err);
            });
        }
    });
}

function createScss() {
    let templateFile = path.resolve(helpers.srcDir, "templates", "page_style.scss");
    let scssFilePath = `${helpers.pagesStylesDir}/${response.pageName}.scss`;
    console.log("creating SCSS file", scssFilePath);

    fs.readFile(templateFile, 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        const content = data;

        if (doWrite){
            fs.writeFile(scssFilePath, content, 'utf8', function (err) {
                if (err) return console.log(err);
            });
        }
    });
}

async function start(): Promise<void> {
    response = await prompts(questions);
    const {pageName, pagePath, title} = response;
    console.log("page path is: ", pagePath);
    console.log("title ", title);


    const baseName = getFilenameFromInput(pageName);

    if (response.pagePath && !response.pagePath.startsWith("/")) {
        response.pagePath = `/${response.pagePath}`;
    }

    console.log('creating pages for ', baseName);
    response.pageName = baseName;

    createHtml();
    createJS();
    createScss();
    updateFirebaseJson();
    updatePagesFile();
}


start().then(() => {
    console.log("Finished creating page")
}).catch(error => {
    console.error("Failed to create page", error);
});

