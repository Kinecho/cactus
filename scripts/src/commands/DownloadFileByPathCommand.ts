import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {Project} from "@scripts/config";
const prompts = require("prompts");
const path = require("path");
import helpers from "@scripts/helpers";
import chalk from "chalk";
import {exec} from "child_process";
import {writeToFile} from "@admin/util/FileUtil";

export default class DownloadFileByPathCommand extends FirebaseCommand {
    name = "Firebase: Download File";
    description = "for a given file path, download it from firebaese storage";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const fileResponse:{filename: string} = await prompts({
            name: "filename",
            type: "text",
            message: "What is the filepath in the bucket?"
        });

        const filename = fileResponse.filename;


        // app.storage().bucket().f
        const storageFile = app.storage().bucket().file(filename);

        const outputPath = path.resolve(helpers.outputDir, "storage", filename);
        console.log("attempting to write to", outputPath);
        await writeToFile(outputPath, "");


        console.log("downloading", storageFile.name);




        await storageFile.download({destination: outputPath});

        console.log(chalk.green(`Downloaded file to ${outputPath}`));
        const doOpenResponse:{doOpen:boolean} = await prompts({
            type: "confirm",
            message: "Do you want to open this file on your computer?",
            name: "doOpen"
        });

        if (doOpenResponse.doOpen){
            exec(`open ${outputPath}`);
        }

        return;
    }

}