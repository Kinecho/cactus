import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import chalk from "chalk";


const app = express();
import * as crypto from "crypto";
import {getConfig} from "@api/config/configService";
import AdminSlackService from "@shared/services/AdminSlackService";
import {PubSub} from "@google-cloud/pubsub";
import {PubSubTopic} from "@shared/types/PubSubTypes";

const config = getConfig();

enum SlackAuthHeader {
    RequestTimestamp = 'x-slack-request-timestamp',
    Signature = 'x-slack-signature',
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

    const payload: {
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
    } = req.body;

    const commandText = payload.text;
    if (commandText === "bigquery") {
        const pubsub = new PubSub();
        await pubsub.topic(PubSubTopic.firestore_export_bigquery).publishJSON({});
        await AdminSlackService.getSharedInstance().sendToResponseUrl(payload.response_url, {text: `BigQuery export job started for project ${config.web.domain}`});
    } else {
        await AdminSlackService.getSharedInstance().sendToResponseUrl(payload.response_url, {text: `Unknown command argument *${commandText}*`});
    }

    resp.sendStatus(204);
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