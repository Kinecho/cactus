import {start, runCommand} from "@scripts/run";
import {setTimestamp} from "@shared/util/FirestoreUtil";
import chalk from "chalk";
import * as admin from "firebase-admin";

setTimestamp(admin.firestore.Timestamp);

if (process.argv && process.argv.length > 2){
    const scriptName = process.argv[2];
    if (!scriptName){
        console.error("you must provide a script name as the first argument");
        process.exit(1);
    }

    console.log(chalk.green("attempting to run"), chalk.blue(scriptName));
    runCommand(scriptName).then(() => {
        console.log("Done!")
    }).catch(error => console.error("Failed to run command ", error));
}
else {
    start().then(() => {
        console.log(chalk.dim("\nDone"));
    }).catch(error => {
        console.error(chalk.red("error", error));
    });
}


