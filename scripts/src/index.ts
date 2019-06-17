import {start} from "@scripts/run";
import {setTimestamp} from "@shared/util/FirebaseUtil";
import chalk from "chalk";
import * as admin from "firebase-admin";

setTimestamp(admin.firestore.Timestamp);

start().then(() => {
    console.log(chalk.dim("\nDone"));
}).catch(error => {
    console.error(chalk.red("error", error));
});