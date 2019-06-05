const prompts = require('prompts');
const {DateTime} = require('luxon');
const helpers = require("./helpers");
const fs = require("fs");
const path = require("path");

console.log('Let\'s crate a static page.');

const doWrite = false;

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
        initial: getUrlFromInput
    },
];

export function getInitialPageName(prev:string, values:any){
    console.log("get initial page name", prev, values);
    return getFilenameFromInput(prev)
}

export function validatePageName(input):boolean|string{
    console.log("validate page name", input);
    let exists = fs.existsSync(path.join(`${helpers.srcDir}`, getFilenameFromInput(input, "html")));

    if (!exists){
        return true;
    }

    return `A page with this name already exists. Please pick a new value`;
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
    let config = require(`${helpers.projectRoot}/firebase.json`);
    let rewrites = config.hosting.rewrites;

    let newPage = {
        source: `${response.pagePath}`,
        destination: `${response.pageName}.html`
    };

    rewrites.unshift(newPage);

    console.log("updated rewrites", rewrites);

    //TODO: actually write to file;

}

function updatePagesFile(){
    let pages = require(`${helpers.webRoot}/pages.js`)
    pages[response.pageName] = {
        title: response.title,
        path: response.pagePath,
    };

    let data = `module.exports = ${JSON.stringify(pages, null, 4)}`

    console.log("printing Pages data \n\n", data);

    if (doWrite){
        fs.writeFile(`${helpers.webRoot}/pages.js`, data, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    }


}

function createHtml() {
    let dir = `${helpers.pagesDir}/${response.pageName}.html`
    console.log("creating", dir)
}

function createJS() {
    let outputFilePath = `${helpers.pagesScriptsDir}/${response.pageName}.ts`
    console.log("creating js file with response = ", response);
    console.log("creating", outputFilePath)

    let templateFile = path.resolve(helpers.srcDir, "templates", "page_script.js")

    fs.readFile(templateFile, 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        const result = data.replace(/\$PAGE_NAME\$/g, response.pageName );

        console.log("\n\nJS File Contents\n\n", result, "\n\n");
        if (doWrite){
            fs.writeFile(outputFilePath, result, 'utf8', function (err) {
                if (err) return console.log(err);
            });
        }

    });

}

function createScss() {
    let dir = `${helpers.pagesStylesDir}/${response.pageName}.scss`
    console.log("creating", dir)
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

