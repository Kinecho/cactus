import { getCactusConfig, Project } from "@scripts/config";
import AdminSlackService, { ChannelName, ChatMessage } from "@admin/services/AdminSlackService";

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
    console.log("is hosting deploy: ", isHosting);

    AdminSlackService.initialize(config);

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
                ts: `${ (new Date()).getTime() / 1000 }`
            }],
        };
        await AdminSlackService.getSharedInstance().sendArbitraryMessage(ChannelName.general, message);
    }
})().then(() => console.log("Done")).catch(e => console.error("Failed to execute slack command", e));
