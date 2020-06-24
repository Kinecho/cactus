import { buildConfig } from "@admin/config/configService";
import * as admin from "firebase-admin";
import * as chalk from "chalk";
import helpers from "@scripts/helpers";
import { CactusConfig } from "@admin/CactusConfig";

const firebaseTools = require("firebase-tools");

const prompts = require("prompts");

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

export async function getAdminCredential(project: Project): Promise<admin.credential.Credential | undefined> {
    // let funcConfig = functions.config();
    const serviceAccount = await import(`${ helpers.projectRoot }/applicationCredentials_${ project }`);
    return admin.credential.cert(serviceAccount);
}

async function getAdminConfig(project: Project, opts: ConfigOptions = DefaultOptions) {

    const apps = await firebaseTools.apps.list("web", { project: project });
    console.log("Firebase apps....", JSON.stringify(apps, null, 2));
    const appId = apps[0].appId;
    process.env.GCLOUD_PROJECT = apps[0].projectId;
    console.log("app id", appId);
    const config = await firebaseTools.apps.sdkconfig("web", appId, { project: project });
    if (opts && opts.useAdmin) {
        try {
            // let funcConfig = functions.config();
            // const serviceAccount = await import(`${helpers.projectRoot}/applicationCredentials_${project}`);
            // const credential = admin.credential.cert(serviceAccount);
            const credential = await getAdminCredential(project);
            config.credential = credential;
        } catch (e) {
            console.error(e);
        }
    }
    return config;
}

export async function getCactusConfig(project: Project): Promise<CactusConfig> {
    const _config = await firebaseTools.functions.config.get(undefined, { project }) as CactusConfig;
    return buildConfig(_config);
}

