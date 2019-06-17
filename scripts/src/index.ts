import {start} from "@scripts/run";
import {setTimestamp} from "@shared/util/FirebaseUtil";
import chalk from "chalk";
import * as admin from "firebase-admin";

setTimestamp(admin.firestore.Timestamp);

if (process.argv && process.argv.length > 0){
    const scriptName = process.argv[0];
    console.log("attempting to run ", scriptName);




}
else {
    start().then(() => {
        console.log(chalk.dim("\nDone"));
    }).catch(error => {
        console.error(chalk.red("error", error));
    });
}


