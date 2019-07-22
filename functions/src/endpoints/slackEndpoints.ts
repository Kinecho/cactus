import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import chalk from "chalk";
import * as crypto from "crypto";
import {getConfig} from "@api/config/configService";
import AdminSlackService from "@shared/services/AdminSlackService";
import {PubSub} from "@google-cloud/pubsub";
import {PubSubTopic} from "@shared/types/PubSubTypes";
import {getActiveUserCountForTrailingDays} from "@api/analytics/BigQueryUtil";


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

export interface CommandResponse {
    text: string,
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
    const [commandName, ...rest] = commandText.split(" ");


    let commandResponse: CommandResponse;
    switch (commandName) {
        case "bigquery":
            commandResponse = await _cmdBigQuery(payload, rest);
            break;
        case "activeUsers":
            commandResponse = await _cmdActiveUserCount(payload, rest);
            break;
        case "durumuru":
            commandResponse = await _cmdDuruMuruToday(payload, rest);
            break;
        default:
            commandResponse = {text: `Unknown command argument *${commandText}*`};
            break;
    }

    await AdminSlackService.getSharedInstance().sendToResponseUrl(payload.response_url, {text: commandResponse.text});

    resp.sendStatus(204);
    return;
});


async function _cmdBigQuery(payload: CommandPayload, params: string[]): Promise<CommandResponse> {
    const pubsub = new PubSub();
    await pubsub.topic(PubSubTopic.firestore_export_bigquery).publishJSON({});


    return {text: `BigQuery export job started for project ${config.web.domain}`};
}

async function _cmdActiveUserCount(payload: CommandPayload, params: string[]): Promise<CommandResponse> {
    let days = 1;
    if (params.length > 0) {
        const [dayArg] = params;
        days = Number(dayArg);
    }

    console.log("getting active users for last ", days);
    const activeUsers = await getActiveUserCountForTrailingDays(days);

    return {text: `There have been *${activeUsers}* unique users with a reflection response over the last *${days}* days`}
}


async function _cmdDuruMuruToday(payload: CommandPayload, params: string[]): Promise<CommandResponse> {
    let days = 1;
    if (params.length > 0) {
        const [dayArg] = params;
        days = Number(dayArg);
    }

    console.log("getting active users for last ", days);
    const activeUsersToday = await getActiveUserCountForTrailingDays(1);
    const activeUsersL30 = await getActiveUserCountForTrailingDays(30);

    return {text: `*${(activeUsersToday/activeUsersL30).toFixed(3)} (${activeUsersToday}/${activeUsersL30})* is today's DURU/MURU\nThat is, ${activeUsersToday} unique users have reflected in the last 24 hours, and ${activeUsersL30} unique users have reflected in the last 30 days.`}
}

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