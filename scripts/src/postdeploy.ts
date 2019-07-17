import chalk from "chalk";
import {getCactusConfig, Project} from "@scripts/config";
import AdminSlackService, {ChatMessage} from "@shared/services/AdminSlackService";

const git = require("simple-git")();

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


    const {username} = await new Promise<{ username?: string }>(resolve => {
        git.raw(['config', '--global', 'user.name'], (error: any, result: string) => {
            if (error) {
                console.error("error");
            }
            resolve({username: result});
        });
    });
    const {email} = await new Promise<{ email?: string }>(resolve => {
        git.raw(['config', '--global', 'user.email'], (error: any, result: string) => {
            if (error) {
                console.error("error");
            }
            resolve({email: result});
        });
    });
    // const isRepo = await

    let byLine = "unknown";
    if (username && email) {
        byLine = `${username.trim()} \<${email.trim()}\>`;
    } else if (username) {
        byLine = username.trim();
    } else if (email) {
        byLine = email.trim();
    }

    console.log(`username ${username} | email ${email}`);

    const message: ChatMessage = {
        text: "",
        attachments: [{
            title: `Finished deploying ${resourceName} :tada:`,
            text: `_started by ${byLine}_`,
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
