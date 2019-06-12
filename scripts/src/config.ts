const firebaseTools = require("firebase-tools");
import * as admin from "firebase-admin";
const yesno = require("yesno");
import chalk from "chalk";
import helpers from "@scripts/helpers";

export enum Project {
    STAGE = "stage",
    PROD = "prod"
}

export interface ConfigOptions {
    useAdmin: boolean
}

export const DefaultOptions:ConfigOptions = {
    useAdmin: false,
};

export async function getAdmin(project:Project, opts:ConfigOptions=DefaultOptions):Promise<admin.app.App>{
    if (project === Project.PROD) {
        console.log(
            chalk.blue.bgRed.bold(
                "\n " +
                "****************************************\n" +
                " WARNING: This process will run in prod  \n" +
                "**************************************** \n\n"
            )
        );

        const question = "Are you sure you want to continue?";
        const doContinue = await new Promise((resolve) => {
            yesno.ask(question, false, (ok:boolean) => {
                if (ok) {
                    console.log("Continuing!");
                    resolve(true);
                } else {
                    process.stdout.write("\nNot continuing.\n\n");
                    resolve(false);
                }
            });
        });
        if (!doContinue) {
            process.exit(1);
        }
    }

    const config = await getConfig(project, opts);

    const app = admin.initializeApp(config);
    app.firestore().settings({timestampsInSnapshots: true});
    return app;
}

async function getConfig(project:Project, opts:ConfigOptions=DefaultOptions) {
    const config = await firebaseTools.setup.web({project: project});
    if (opts && opts.useAdmin) {
        try {
            // let funcConfig = functions.config();
            const serviceAccount = await import(`${helpers.projectRoot}/applicationCredentials_${project}`);
            const credential = admin.credential.cert(serviceAccount);
            config.credential = credential;
        } catch (e) {
            console.error(e);
        }
    }
    return config;
}
