// require("module-alias/register");
import {promisify} from "util";
import * as admin from "firebase-admin";
import helpers from "@scripts/helpers";
const prompts = require("prompts");
const path = require("path");
const fs = require("fs");
import chalk from "chalk";
import {getAdmin, Project} from "@scripts/config";

import "@shared/mailchimp/models/ListMember"

export interface Command {
    app?: admin.app.App,
    project: Project,
    run: () => Promise<void>,
}

export interface ProjectInput {
    project: Project,
}

export interface BaseCommandConstructorArgs {
    useAdmin: boolean;
}

export abstract class BaseCommand implements Command {
    project: Project = Project.STAGE;
    app?: admin.app.App;
    useAdmin:boolean;

    abstract async run():Promise<void>;

    protected constructor(opts:BaseCommandConstructorArgs={useAdmin:false}){
        this.useAdmin = opts.useAdmin;
    }

     async getFirebaseApp():Promise<admin.app.App> {
        if (this.app){
            return this.app;
        }

        const questions = [
            {
                type: "select",
                name: 'project',
                message: 'Choose environment',
                choices: [{title: "Cactus Stage", value: Project.STAGE}, {title: "Cactus Prod", value: Project.PROD}],
                limit: 20,
            },
        ];

        const response:ProjectInput = await prompts(questions, {
            onCancel: () => {
                console.log("Canceled command");
                return process.exit(0);
            }
        });

        this.project = response.project;
        this.app = await getAdmin(this.project, {useAdmin: this.useAdmin})

         if (!this.app){
             console.error("Failed to get the firebase app");
             process.exit(1);
         }

         console.log("Got app", this.app.options.projectId);

        return this.app;
    }
}

export interface InputResponse {
    command: string,
}

async function getAllCommands(): Promise<string[]> {
    console.log("reading all files in", helpers.commandsDir);
    return await promisify(fs.readdir)(helpers.commandsDir);
}


export function validateFileExists(filename:string, directory:string=""): boolean | string {
    const fileExists = fs.existsSync(path.resolve(directory, filename));

    if (fileExists) {
        return true;
    }

    return `Unable to find this page. Please pick a new value`;
}

async function start():Promise<void> {
    const commands = (await getAllCommands()).map(file => ({title: file}));


    let canceled = false;
    const questions = [
        {
            type: "autocomplete",
            name: 'command',
            message: 'Page (type to filter)',
            // initial: (prev, values) => formatFilename(values.title),
            validate: (filename:string) => validateFileExists(filename, helpers.commandsDir),
            // format: formatFilename,
            choices: commands,
            limit: 20,
        },
    ];

    const response:InputResponse = await prompts(questions, {
        onCancel: () => {
            console.log("Canceled deletion");
            canceled = true;
        }
    });

    if (canceled){
        console.log("Canceled execution.");
        return;
    }

    const {command: commandFilename} = response;

    console.log("Running script", chalk.yellow(commandFilename));
    // console.log(ListMember);

    const command = await loadCommand(commandFilename);
    await command.run();

    return;
}

async function loadCommand(filename:string):Promise<Command>{
    const LoadedCommand = await import(`@scripts/${helpers.commandsDirRelativeToSource}/${filename}`);
    return new LoadedCommand.default();
}


start().then(() => {
    console.log(chalk.green("complete"));
}).catch(error => {
    console.error(chalk.red("error", error));
});