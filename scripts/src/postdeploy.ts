import { getCactusConfig, Project } from "@scripts/config";
import AdminSlackService, { ChannelName, ChatMessage } from "@admin/services/AdminSlackService";
import simpleGit, { SimpleGit } from 'simple-git';

const git: SimpleGit = simpleGit();
(async () => {
    const projectId = process.env.GCLOUD_PROJECT;
    const isProd = projectId === 'cactus-app-prod';

    let resource = "Unknown";
    console.log(process.argv);
    if (process.argv && process.argv.length > 2) {
        resource = process.argv[2];
    }

    console.log(`Running ${ resource } ${ isProd ? "Prod" : "Stage" } postdeploy hook`);

    const config = await getCactusConfig(isProd ? Project.PROD : Project.STAGE);
    console.log(`web domain from config: ${ config.web.domain }`);

    let isHosting = false;
    if (resource.toLowerCase().trim().includes("hosting") && !resource.toLowerCase().includes("storybook")) {
        isHosting = true;
    }
    const isAlt = isHosting && resource.includes("alt");

    console.log("is hosting deploy: ", isHosting);

    AdminSlackService.initialize(config);

    const branch = (await git.branchLocal()).current;

    if (isProd && isHosting) {
        const appName = isAlt ? `Prod-Alt \`${ branch }\`` : "Prod"
        const url = isAlt ? "https://cactus-app-prod-alt.web.app" : "https://cactus.app";
        const message: ChatMessage = {
            text: "",
            attachments: [{
                text: `:white_check_mark: *${ appName }* has been updated. <${ url }|Check it out>.`,
                color: "good",
                ts: `${ (new Date()).getTime() / 1000 }`
            }],
        };
        await AdminSlackService.getSharedInstance().sendGeneralMessage(message);
    } else if (isHosting) {
        const appName = isAlt ? `Stage - Alt \`${ branch }\`` : "Stage"
        const url = isAlt ? "https://cactus-app-stage-alt.web.app" : "https://cactus-app-stage.web.app";
        const emoji = isAlt ? ":fire:" : ""
        const message: ChatMessage = {
            text: "",
            attachments: [{
                text: `${ emoji } *${ appName }* has been updated. <${ url }|Check it out>.`.trim(),
                ts: `${ (new Date()).getTime() / 1000 }`
            }],
        };
        await AdminSlackService.getSharedInstance().sendArbitraryMessage(ChannelName.general, message);
    }
})().then(() => console.log("Done")).catch(e => console.error("Failed to execute slack command", e));
