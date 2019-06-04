const prompts = require('prompts')
const {DateTime} = require('luxon')
const helpers = require("./helpers");
const fs = require("fs");
const path = require("path");

console.log('Let\'s crate a static page.')

let inputs;

const questions = [
    {
        type: 'toggle',
        name: 'isDateBased',
        message: 'Is this page based on a date?',
        initial: true,
        active: 'yes',
        inactive: 'no',
    },
    {
        type: prev => prev === true ? 'date' : null,
        initial: new Date(),
        name: 'pageDate',
        mask: "YYYY-MM-DD",
        message: "What day is this page for?",
        validate: validateDate
    },
    {
        type: prev => !(prev instanceof Date) ? 'text' : null,
        name: 'pageName',
        message: 'What should we name the files? Don\'t include a file extension.',
    },
    {
        type: "text",
        name: 'title',
        message: 'What is the title of this page?',
    },
    {
        type: 'text',
        name: 'pagePath',
        message: 'What is the path (url) for this page? Don\'t include the leading slash',
    },
];


function validateDate(input){
    console.log("date value validation", input);
    let exists = fs.existsSync(path.join(`${helpers.srcDir}`, getFilenameFromDate(input, "html")))


    if (!exists){
        return true;
    }

    return `this date (${DateTime.fromJSDate(input).toISODate()}) has already been created. Pick a new value`;
}

function getFilenameFromDate(date, extension){
    return`${DateTime.fromJSDate(date).toISODate()}${extension ? `.${extension}` : ""}`
}


(async () => {
    const response = await prompts(questions)
    const {isDateBased, pageDate, pageName, pagePath, title} = response
    console.log("page path is: ", pagePath)
    console.log("title ", title)
    let baseName = ""


    if (isDateBased && pageDate) {
        baseName = getFilenameFromDate(pageDate)
    } else {
        baseName = `${pageName.trim().toLowerCase().replace(/\s+/g, '_')}`
    }

    console.log('creating pages for ', baseName);

    inputs = response;

    createHtml(baseName);
    createJS(baseName);
    createScss(baseName);
})()

function createHtml(baseName) {
    let dir = `${helpers.pagesDir}/${baseName}.html`
    console.log("creating", dir)
}

function createJS(baseName) {
    let outputFilePath = `${helpers.pagesScriptsDir}/${baseName}.ts`
    console.log("creating", outputFilePath)

    let templateFile = path.resolve(__dirname, "templates/page_script.js")

    fs.readFile(templateFile, 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        const result = data.replace("$PAGE_TITLE$", inputs.pageTitle );

        fs.writeFile(outputFilePath, result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });

}

function createScss(baseName) {
    let dir = `${helpers.pagesStylesDir}/${baseName}.scss`
    console.log("creating", dir)
}