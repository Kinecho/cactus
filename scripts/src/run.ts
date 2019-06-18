// require("module-alias/register");
import {promisify} from "util";
import * as admin from "firebase-admin";
import helpers from "@scripts/helpers";
import chalk from "chalk";
import {getAdmin, Project} from "@scripts/config";
import {setAdmin} from "@api/services/firestoreService";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";

const prompts = require("prompts");
const path = require("path");
const fs = require("fs");

function resetConsole(){
    process.stdout.write('\x1B[2J\x1B[0f');
}

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
    firestoreService?:AdminFirestoreService;

    protected abstract async run(app: admin.app.App, firestoreService: AdminFirestoreService): Promise<void>;

    async start():Promise<void>{
        const app = await this.getFirebaseApp();
        const firestoreService = new AdminFirestoreService(app);
        this.firestoreService = firestoreService;
        console.group(chalk.yellow(`${this.name} Logs:`));
        await this.run(app, firestoreService);
        console.groupEnd();
    }

    protected constructor(opts: FirebaseCommandConstructorArgs = {useAdmin: false, name: "Command"}) {
        this.useAdmin = opts.useAdmin;
        this.name = opts.name;
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

        setAdmin(this.app);

        return this.app;
    }
}

export interface InputResponse {
    command: string,
}

export async function getAllCommands(): Promise<string[]> {
    console.log("reading all files in", helpers.commandsDir);
    const commands = await promisify(fs.readdir)(helpers.commandsDir);
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
    return validateFileExists(commandName, helpers.commandsDir)
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
    const LoadedCommand = await import(`@scripts/${helpers.commandsDirRelativeToSource}/${filename}`);
    return new LoadedCommand.default();
}