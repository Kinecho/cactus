import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import chalk from "chalk";
import * as crypto from "crypto";
import {getConfig} from "@api/config/configService";
import AdminSlackService, {SlackResponseType} from "@admin/services/AdminSlackService";
import {PubSub} from "@google-cloud/pubsub";
import {PubSubTopic} from "@shared/types/PubSubTypes";
import {JobRequest, JobType, processJob} from "@api/pubsub/subscribers/SlackCommandJob";


const app = express();

const config = getConfig();

enum SlackAuthHeader {
    RequestTimestamp = 'x-slack-request-timestamp',
    Signature = 'x-slack-signature',
}

export interface CommandPayload {
    token: string,
    team_id: string,
    team_domain: string,
    channel_id: string,
    user_id: string,
    user_name: string,
    command: string,
    text: string,
    response_url: string,
    trigger_id: string,
}

const versionNumber = "v0";

const signatureHandler = (req: functions.https.Request | any, resp: functions.Response, next: Function) => {
    const headers = req.headers;
    const timestamp = headers[SlackAuthHeader.RequestTimestamp];

    const base = `${versionNumber}:${timestamp}:${req.rawBody}`;
    const hash = crypto.createHmac('sha256', config.slack.app.signing_secret).update(base).digest('hex');

    const signature = headers[SlackAuthHeader.Signature];
    const verified = `${versionNumber}=${hash}` === signature;
    if (!verified) {
        resp.sendStatus(403);
    }
    next();
};

app.use(cors({origin: true}));
app.use(signatureHandler);


app.post("/commands", async (req: functions.https.Request | any, resp: functions.Response) => {
    console.log("req", chalk.cyan(JSON.stringify(req.body, null, 2)));

    const payload: CommandPayload = req.body;


    const commandText = payload.text;
    const [commandName, ...rest] = commandText.split(" ").map(s => s.trim());

    const immediate = rest.includes("immediate");

    let jobType: JobType | undefined = undefined;
    let jobPayload: any = undefined;
    switch (commandName) {
        case "bigquery":
            jobType = JobType.bigquery;
            break;
        case "activeUsers":
            jobType = JobType.activeUsers;
            jobPayload = rest;
            break;
        case "durumuru":
            jobPayload = rest;
            jobType = JobType.durumuru;
            break;
        case "today":
            jobType = JobType.today;
            break;
        default:
            break;
    }

    if (!jobType) {
        await AdminSlackService.getSharedInstance().sendToResponseUrl(payload.response_url, {
            text: `Unknown command name: \`${commandName}\``,
            response_type: SlackResponseType.ephemeral
        });
        resp.sendStatus(200);
        return;
    }

    const job: JobRequest = {
        type: jobType,
        payload: jobPayload,
        slackResponseURL: payload.response_url,
    };

    console.log("Sending job to pubsub topic", JSON.stringify(job, null, 2));

    const slackCmdName = `${commandName} ${rest}`.trim();
    if (!immediate) {
        const pubsub = new PubSub();
        await pubsub.topic(PubSubTopic.slack_command).publishJSON(job);

        resp.status(200).send({text: `:hourglass_flowing_sand: Processing Job \`${slackCmdName}\`: \n\`${JSON.stringify(job)}\``});
        resp.end();
    } else {
        console.warn("Processing slack command immediately");
        try {
            await processJob(job);
        } catch (error) {
            resp.status(200).send({text: `Error Processing Job \`${slackCmdName}\`: \n\`${JSON.stringify(job)}\`\n\`${error.message || error}\``});
        }

    }


    return;
});

app.post("/actions", async (req: functions.https.Request | any, resp: functions.Response) => {

    const payload: {
        type: string,
        token: string,
        action_ts: string,
        team: {
            id: string,
            domain: string,
        },
        user: {
            id: string,
            name: string,
        },
        channel: {
            id: string,
            name: string,
        },
        callback_id: string,
        trigger_id: string,
        message_ts: string,
        message: {
            client_msg_id: string,
            type: string,
            text: string,
            user: string,
            ts: string,
            team: string,
        },
        response_url: string,
    } = JSON.parse(req.body.payload);

    const callbackId: string | undefined = payload.callback_id;
    console.log('body: ', chalk.blue(JSON.stringify(payload, null, 2)));
    if (callbackId === 'get_mailchimp_member') {
        await AdminSlackService.getSharedInstance().sendToResponseUrl(payload.response_url, {text: "This doesnt do anything useful... yet"});

        resp.send({success: true});
    } else {
        resp.sendStatus(400);
    }
});

export default app;