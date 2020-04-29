import chalk from "chalk";

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

    console.log(chalk.green(`${resource} Deploy Finished! ${isProd ? "Prod" : "Stage"}`));

    // const envName = isProd ? 'Prod' : 'Stage';
    // const config = await getCactusConfig(isProd ? Project.PROD : Project.STAGE);

    // let resourceName = resource;
    // if (resource.toLowerCase().trim() === "hosting") {
        // resourceName = `<https://${config.web.domain}|Web>`
    // }
    // console.log(`got config: ${config.web.domain}`);


    // AdminSlackService.initialize(config);
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

    // const hash = await git.revparse(["HEAD"]);
    //
    // const message: ChatMessage = {
    //     text: "",
    //     attachments: [{
    //         text: `Finished deploying ${resourceName} to ${envName}`,
    //         // text: `<https://sentry.io/organizations/kinecho/releases/${hash}|Sentry Release>: \`${hash}\`\n_started by ${byLine}_`,
    //         color: "good",
    //         ts: `${(new Date()).getTime() / 1000}`
    //     }],
    // };


    // if (isProd && resource === "hosting") {
    //     await AdminSlackService.getSharedInstance().sendGeneralMessage({text: `A new version of the website has been released! See it <https://cactus.app|here>`});
    // }
    // await AdminSlackService.getSharedInstance().sendCIMessage(message);

})().then(() => console.log("Done")).catch(e => console.error("Failed to execute slack command", e));
