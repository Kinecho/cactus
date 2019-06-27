// require("module-alias/register");
import {promisify} from "util";
import helpers from "@scripts/helpers";
import {resetConsole} from "@scripts/util/ConsoleUtil";
import {Command} from "@scripts/CommandTypes";

const prompts = require("prompts");
const path = require("path");
const fs = require("fs");


export interface InputResponse {
    command: Command,
}

export async function getAllCommandFilenames(): Promise<string[]> {
    console.log("reading all files in", helpers.publicCommandsDirRelativeToSource);
    const commands = await promisify(fs.readdir)(helpers.publicCommandsDir);
    return commands.filter((name:string) => !name.endsWith("test.ts"));
}

export async function getCommandNames(): Promise<{name: string, command: Command}[]>{
    const filenames = await getAllCommandFilenames();

    const tasks:Promise<Command>[] = [];

    filenames.forEach(filename => {
        tasks.push(new Promise(async resolve => {
            const LoadedCommand:Command = await loadCommand(filename);
            resolve(LoadedCommand);
        }));
    });


    return (await Promise.all(tasks)).filter(cmd => cmd.showInList).map(cmd => ({
        name: cmd.name + (cmd.description ? ` - ${cmd.description}` : ""),
        command: cmd,
    } ));

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
    // const commands = (await getAllCommandFilenames()).map(file => ({title: file}));
    const commands = (await getCommandNames()).map((cmd) => ({title: cmd.name, value: cmd.command}));
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

    const {command} = response;

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