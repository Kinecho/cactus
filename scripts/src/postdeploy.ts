import chalk from "chalk";
import { getCactusConfig, Project } from "@scripts/config";
import AdminSlackService, { ChatMessage } from "@admin/services/AdminSlackService";

// import * as simplegit from 'simple-git/promise';

// const git = simplegit();

(async () => {
    const projectId = process.env.GCLOUD_PROJECT;
    const isProd = projectId === 'cactus-app-prod';

    let resource = "Unknown";
    console.log(process.argv);
    if (process.argv && process.argv.length > 2) {
        resource = process.argv[2];
    }

    console.log(chalk.green(`Running ${ resource } ${ isProd ? "Prod" : "Stage" } postdeploy hook`));

    // const envName = isProd ? 'Prod' : 'Stage';
    const config = await getCactusConfig(isProd ? Project.PROD : Project.STAGE);
    console.log(`web domain from config: ${ config.web.domain }`);

    // let resourceSlackLink = resource;
    let isHosting = false;
    if (resource.toLowerCase().trim().includes("hosting") && !resource.toLowerCase().includes("storybook")) {
        isHosting = true;
        // resourceSlackLink = `<https://${ config.web.domain }|Web>`
    }
    console.log("is hosting deploy: ", isHosting);

    AdminSlackService.initialize(config);

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

    // console.log(`username ${ username } | email ${ email }`);

    // const hash = await git.revparse(["HEAD"]);
    //


    if (isProd && isHosting) {
        const message: ChatMessage = {
            text: "",
            attachments: [{
                text: `:white_check_mark: *Prod* has been updated. <https://cactus.app|Check it out>.`,
                color: "good",
                ts: `${ (new Date()).getTime() / 1000 }`
            }],
        };
        await AdminSlackService.getSharedInstance().sendGeneralMessage(message);
    } else if (isHosting) {
        const message: ChatMessage = {
            text: "",
            attachments: [{
                text: `*Stage* has been updated. <https://cactus-app-stage.web.app|Check it out>.`,
                // color: "good",
                ts: `${ (new Date()).getTime() / 1000 }`
            }],
        };
        await AdminSlackService.getSharedInstance().sendGeneralMessage(message);
    }
})().then(() => console.log("Done")).catch(e => console.error("Failed to execute slack command", e));
