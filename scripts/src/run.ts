// require("module-alias/register");
import {promisify} from "util";
import * as admin from "firebase-admin";
import helpers from "@scripts/helpers";
import chalk from "chalk";
import {getAdmin, Project} from "@scripts/config";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import {resetConsole} from "@scripts/util/ConsoleUtil";

const prompts = require("prompts");
const path = require("path");
const fs = require("fs");


export interface Command {
    name: string;
    start: () => Promise<void>,
}

export interface ProjectInput {
    project: Project,
}

export interface FirebaseCommandConstructorArgs {
    useAdmin: boolean;
    name: string;
}

export abstract class FirebaseCommand implements Command {
    project?: Project; //default project to stage
    app?: admin.app.App;
    useAdmin: boolean;
    name: string;
    description?: string;
    confirmExecution: boolean = false;
    firestoreService?:AdminFirestoreService;

    protected abstract async run(app: admin.app.App, firestoreService: AdminFirestoreService): Promise<void>;

    async start():Promise<void>{
        if (this.description){
            console.log(`\n${this.description}\n`)
        }

        if (this.confirmExecution){
            const {confirmed} = await prompts([{
                type: "confirm",
                message: "Do you want to run this command?",
                name: "confirmed"
            }]);

            if (!confirmed){
                console.log(`\n${chalk.red("Not running command")}`);
                return;
            }
        }

        const app = await this.getFirebaseApp();
        const firestoreService = await this.getFirestoreService();

        console.group(chalk.yellow(`${this.name} Logs:`));
        await this.run(app, firestoreService);
        console.groupEnd();
    }

    protected constructor(opts: FirebaseCommandConstructorArgs = {useAdmin: false, name: "Command"}) {
        this.useAdmin = opts.useAdmin;
        this.name = opts.name;
    }

    async getFirestoreService():Promise<AdminFirestoreService> {
        if (this.firestoreService){
            return this.firestoreService;
        }

        const app = await this.getFirebaseApp();
        this.firestoreService = new AdminFirestoreService(app);
        return this.firestoreService;
    }

    async getFirebaseApp(): Promise<admin.app.App> {
        if (this.app) {
            return this.app;
        }

        if (!this.project){
            const questions = [
                {
                    type: "select",
                    name: 'project',
                    message: 'Choose environment',
                    choices: [{title: "Cactus Stage", value: Project.STAGE}, {title: "Cactus Prod", value: Project.PROD}],
                    limit: 20,
                },
            ];
            const response: ProjectInput = await prompts(questions, {
                onCancel: () => {
                    console.log("Canceled command");
                    return process.exit(0);
                }
            });

            this.project = response.project;
        }

        this.app = await getAdmin(this.project, {useAdmin: this.useAdmin});

        if (!this.app) {
            console.error("Failed to get the firebase app");
            process.exit(1);
        }
        resetConsole();
        const separator = "====================================================";
        const message = `${separator}\n Starting ${this.name}\n Using firebase project ${chalk.blue(this.app.options.projectId || "unknown")}\n${separator}`;
        console.log(chalk.bold.green(message));

        // setAdmin(this.app);

        return this.app;
    }
}

export interface InputResponse {
    command: string,
}

export async function getAllCommands(): Promise<string[]> {
    console.log("reading all files in", helpers.publicCommandsDirRelativeToSource);
    const commands = await promisify(fs.readdir)(helpers.publicCommandsDir);
    return commands.filter((name:string) => !name.endsWith("test.ts"));
}


export function validateFileExists(filename: string, directory: string = ""): boolean | string {
    const fileExists = fs.existsSync(path.resolve(directory, filename));

    if (fileExists) {
        return true;
    }

    return `Unable to find this page. Please pick a new value`;
}

export function validateCommandExists(commandName: string): boolean | string {
    return validateFileExists(commandName, helpers.publicCommandsDir)
}

export async function start(): Promise<void> {
    const commands = (await getAllCommands()).map(file => ({title: file}));
    resetConsole();
    let canceled = false;
    const questions = [
        {
            type: "autocomplete",
            name: 'command',
            message: 'Chose a command to run (type to filter)',
            // initial: (prev, values) => formatFilename(values.title),
            validate: (filename: string) => validateCommandExists(filename),
            // format: formatFilename,
            choices: commands,
            limit: 20,
        },
    ];

    const response: InputResponse = await prompts(questions, {
        onCancel: () => {
            console.log("Canceled deletion");
            canceled = true;
        }
    });

    if (canceled) {
        console.log("Canceled execution.");
        return;
    }

    const {command: commandFilename} = response;

    console.log("Running script", chalk.yellow(commandFilename));
    // console.log(ListMember);

    const command = await loadCommand(commandFilename);
    await command.start();

    return;
}

export async function runCommand(name:string): Promise<void> {
    const command = await loadCommand(name);
    resetConsole();
    console.log("Running command " + command.name);
    await command.start();
}

async function loadCommand(filename: string): Promise<Command> {
    const LoadedCommand = await import(`@scripts/${helpers.publicCommandsDirRelativeToSource}/${filename}`);
    return new LoadedCommand.default();
}