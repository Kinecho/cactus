const prompts = require('prompts')
const {DateTime} = require('luxon')
const helpers = require("./helpers");
const fs = require("fs");
const path = require("path");

console.log('Let\'s crate a static page.')

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
        message: 'What is the name of the page?',
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
    const {isDateBased, pageDate, pageName} = response
    // => response => { username, age, about }
    let baseName = ""
    // let date = DateTime.fromFormat(isDateBased)

    if (isDateBased && pageDate) {
        baseName = getFilenameFromDate(pageDate)
    } else {
        baseName = `${pageName.trim().toLowerCase().replace(/\s+/g, '_')}`
    }

    console.log('creating pages for ', baseName);
    createHtml(baseName);
    createJS(baseName);
    createScss(baseName);
})()

function createHtml(baseName) {
    let dir = `${helpers.pagesDir}/${baseName}.html`
    console.log("creating", dir)
}

function createJS(baseName) {
    let dir = `${helpers.pagesScriptsDir}/${baseName}.ts`
    console.log("creating", dir)
}

function createScss(baseName) {
    let dir = `${helpers.pagesStylesDir}/${baseName}.scss`
    console.log("creating", dir)
}