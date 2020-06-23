import chalk from "chalk";
import { getCactusConfig, Project } from "@scripts/config";
import helpers from "@scripts/helpers";
import { CactusConfig } from "@admin/CactusConfig";
import { getAppSiteConfig } from "@scripts/appleAppSiteAssociation";
import { copyFileSync, writeFileSync } from "fs";
import * as path from "path";

// const git = simplegit();

(async () => {
    const projectId = process.env.GCLOUD_PROJECT;
    const isProd = projectId === 'cactus-app-prod';

    let resource = "Unknown";
    console.log(process.argv);
    if (process.argv && process.argv.length > 2) {
        resource = process.argv[2];
    }

    // const envName = isProd ? 'Prod' : 'Stage';
    console.log(chalk.green(`${resource} Starting Deploy to ${isProd ? "Prod" : "Stage"}`));

    const config = await getCactusConfig(isProd ? Project.PROD : Project.STAGE);

    createAppAppSiteAssociationFile(config);
    createAppleDeveloperDomainAssociationFile(config);

    // let resourceName = resource;
    // if (resource.toLowerCase().trim() === "hosting") {
    //     resourceName = `<https://${config.web.domain}|Web>`
    // }
    // console.log(`got config: ${config.web.domain}`);
    //
    //
    // const username: string | undefined | null = await git.raw(['config', '--global', 'user.name']);
    // const email: string | undefined | null = await git.raw(['config', '--global', 'user.email']);
    //
    // let byLine = "unknown";
    // if (username && email) {
    //     byLine = `${username.trim()} \<${email.trim()}\>`;
    // } else if (username) {
    //     byLine = username.trim();
    // } else if (email) {
    //     byLine = email.trim();
    // }
    //
    // console.log(`username ${username} | email ${email}`);
    //
    // const hash = await git.revparse(["HEAD"]);
    //
    // const message: ChatMessage = {
    //     text: "",
    //     attachments: [{
    //         title: `Starting the deployment process for ${resourceName} - ${envName}`,
    //         text: `<https://sentry.io/organizations/kinecho/releases/${hash}|Sentry Release>: \`${hash}\`\n_started by ${byLine}_`,
    //         ts: `${(new Date()).getTime() / 1000}`
    //     }],
    // };
    //
    // AdminSlackService.initialize(config);
    // await AdminSlackService.getSharedInstance().sendCIMessage(message);

})().then(() => console.log("Done")).catch(e => console.error("Failed to execute slack command", e));

function createAppAppSiteAssociationFile(config: CactusConfig) {
    const appAssociation = getAppSiteConfig(config);

    const fileContents = JSON.stringify(appAssociation);
    writeFileSync(helpers.appAssociationFile, fileContents);
}

function createAppleDeveloperDomainAssociationFile(config: CactusConfig) {
    const inputPath = path.join(helpers.webHelpers.webRoot, `apple-developer-domain-association.${config.app.environment === "prod" ? "prod" : "stage"}.txt`);
    const outputPath = path.join(helpers.webHelpers.webRoot, "apple-developer-domain-association.txt");
    copyFileSync(inputPath, outputPath)
}