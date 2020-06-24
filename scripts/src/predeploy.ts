import { getCactusConfig, Project } from "@scripts/config";
import helpers from "@scripts/helpers";
import { CactusConfig } from "@admin/CactusConfig";
import { getAppSiteConfig } from "@scripts/appleAppSiteAssociation";
import { copyFileSync, writeFileSync } from "fs";
import * as path from "path";

(async () => {
    const projectId = process.env.GCLOUD_PROJECT;
    const isProd = projectId === 'cactus-app-prod';

    let resource = "Unknown";
    console.log(process.argv);
    if (process.argv && process.argv.length > 2) {
        resource = process.argv[2];
    }

    console.log(`${ resource } Starting Deploy to ${ isProd ? "Prod" : "Stage" }`);

    const config = await getCactusConfig(isProd ? Project.PROD : Project.STAGE);

    createAppAppSiteAssociationFile(config);
    createAppleDeveloperDomainAssociationFile(config);

})().then(() => console.log("Done")).catch(e => console.error("Failed to execute slack command", e));

function createAppAppSiteAssociationFile(config: CactusConfig) {
    const appAssociation = getAppSiteConfig(config);

    const fileContents = JSON.stringify(appAssociation);
    writeFileSync(helpers.appAssociationFile, fileContents);
}

function createAppleDeveloperDomainAssociationFile(config: CactusConfig) {
    const inputPath = path.join(helpers.webHelpers.webRoot, `apple-developer-domain-association.${ config.app.environment === "prod" ? "prod" : "stage" }.txt`);
    const outputPath = path.join(helpers.webHelpers.webRoot, "apple-developer-domain-association.txt");
    copyFileSync(inputPath, outputPath)
}