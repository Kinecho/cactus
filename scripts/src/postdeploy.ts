import chalk from "chalk";
import {getCactusConfig, Project} from "@scripts/config";
import AdminSlackService, {ChatMessage} from "@shared/services/AdminSlackService";


(async () => {
    const projectId = process.env.GCLOUD_PROJECT;
    const isProd = projectId === 'cactus-app-prod';

    let resource = "Unknown";
    console.log(process.argv);
    if (process.argv && process.argv.length > 2) {
        resource = process.argv[2];
    }

    console.log(chalk.green(`${resource} Deploy Finished! ${isProd ? "Prod" : "Stage"}`));

    const config = await getCactusConfig(isProd ? Project.PROD : Project.STAGE);

    let resourceName = resource;
    if (resource.toLowerCase().trim() === "hosting") {
        resourceName = `<https://${config.web.domain}|Web>`
    }
    console.log(`got config: ${config.web.domain}`);


    AdminSlackService.initialize(config);

    const message: ChatMessage = {
        text: "",
        attachments: [{
            title: `Finished deploying ${resourceName} :tada:`,
            color: "good",
            ts: `${(new Date()).getTime() / 1000}`
        }],
    };


    if (isProd && resource === "hosting") {
        await AdminSlackService.getSharedInstance().sendGeneralMessage(message);
    } else {
        await AdminSlackService.getSharedInstance().sendEngineeringMessage(message);
    }


})();
