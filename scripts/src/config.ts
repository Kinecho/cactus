import {buildConfig} from "@admin/config/configService";

const firebaseTools = require("firebase-tools");
import * as admin from "firebase-admin";

const prompts = require("prompts");
import chalk from "chalk";
import helpers from "@scripts/helpers";
import {CactusConfig} from "@shared/CactusConfig";

export enum Project {
    STAGE = "stage",
    PROD = "prod"
}

export interface ConfigOptions {
    useAdmin: boolean
}

export const DefaultOptions: ConfigOptions = {
    useAdmin: false,
};

export async function getAdmin(project: Project, opts: ConfigOptions = DefaultOptions): Promise<admin.app.App> {
    if (project === Project.PROD) {
        console.log(
            chalk.blue.bgRed.bold(
                "\n " +
                "****************************************\n" +
                " WARNING: This process will run in prod  \n" +
                "**************************************** \n\n"
            )
        );

        const response = await prompts({
            type: "confirm",
            message: "Are you sure you want to continue?",
            name: "doContinue",
        });

        if (!response.doContinue) {
            console.log("not continuing");
            process.exit(0);
        } else {
            console.log("Continuing")
        }

    }

    const config = await getAdminConfig(project, opts);
    const app = admin.initializeApp(config);
    return app;
}

async function getAdminConfig(project: Project, opts: ConfigOptions = DefaultOptions) {
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

export async function getCactusConfig(project: Project): Promise<CactusConfig> {
    const _config = await firebaseTools.functions.config.get(undefined, {project}) as CactusConfig;
    return buildConfig(_config);
}

