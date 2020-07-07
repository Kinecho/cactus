import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import * as crypto from "crypto";
import { getConfig } from "@admin/config/configService";
import AdminSlackService, { SlackAttachment, SlackResponseType } from "@admin/services/AdminSlackService";
import { PubSub } from "@google-cloud/pubsub";
import { PubSubTopic } from "@shared/types/PubSubTypes";
import { getSlackHelpText, JobRequest, JobType, processJob } from "@api/pubsub/subscribers/SlackCommandJob";
import Logger from "@shared/Logger";
import { isBlank, isValidEmail } from "@shared/util/StringUtil";

const logger = new Logger("slackEndpoints");
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

    const base = `${ versionNumber }:${ timestamp }:${ req.rawBody }`;
    const hash = crypto.createHmac('sha256', config.slack.app.signing_secret).update(base).digest('hex');

    const signature = headers[SlackAuthHeader.Signature];
    const verified = `${ versionNumber }=${ hash }` === signature;
    if (!verified) {
        resp.sendStatus(403);
    }
    next();
};

app.use(cors({ origin: true }));
app.use(signatureHandler);

app.post("/commands/stats", async (req: functions.https.Request | any, resp: functions.Response) => {
    const payload: CommandPayload = req.body;
    const payloadText = payload.text;
    const [memberEmail, ...rest] = payloadText.split(" ").map(s => s.trim());
    const immediate = rest.includes("immediate");
    logger.info(`Getting stats for ${ memberEmail }`);


    if (isBlank(memberEmail) || !isValidEmail(memberEmail)) {
        const attachments: SlackAttachment[] = [];
        attachments.push({
            text: "Please provide a a valid email address to get stats for. The command should be run like this: `/stats name@example.com",
            color: "warning"
        });

        await AdminSlackService.getSharedInstance().sendToResponseUrl(payload.response_url, {
            attachments,
            response_type: SlackResponseType.ephemeral
        });
        resp.sendStatus(200);
        return;
    }

    const job: JobRequest = {
        type: JobType.memberStats,
        payload: memberEmail,
        slackResponseURL: payload.response_url,
    };

    await submitJobAndReturn({ job, args: rest, immediate, response: resp });
    return;
});


app.post("/commands/member", async (req: functions.https.Request | any, resp: functions.Response) => {
    const payload: CommandPayload = req.body;
    const payloadText = payload.text;
    const [memberEmail, ...rest] = payloadText.split(" ").map(s => s.trim());
    const immediate = rest.includes("immediate");
    logger.info(`Getting stats for ${ memberEmail }`);

    if (isBlank(memberEmail) || !isValidEmail(memberEmail)) {
        const attachments: SlackAttachment[] = [];
        attachments.push({
            text: "Please provide a a valid email address to get stats for. The command should be run like this: `/stats name@example.com",
            color: "warning"
        });

        await AdminSlackService.getSharedInstance().sendToResponseUrl(payload.response_url, {
            attachments,
            response_type: SlackResponseType.ephemeral
        });
        resp.sendStatus(200);
        return;
    }

    const job: JobRequest = {
        type: JobType.user,
        payload: memberEmail,
        slackResponseURL: payload.response_url,
        channelName: payload.channel_id,
        userId: payload.user_id,
        userName: payload.user_name
    };

    await submitJobAndReturn({ job, args: rest, immediate, response: resp });
    return;
});

app.post("/commands", async (req: functions.https.Request | any, resp: functions.Response) => {
    logger.log("req", JSON.stringify(req.body, null, 2));

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
        const { intro, commands } = getSlackHelpText();
        const attachments: SlackAttachment[] = [];
        if (commandName.trim().length > 0) {
            attachments.unshift({
                text: `Unknown command name: \`${ commandName }\``,
                color: "danger"
            })
        }

        attachments.push({
            text: intro,
            color: "good"
        }, {
            text: commands,
            color: "good"
        });

        await AdminSlackService.getSharedInstance().sendToResponseUrl(payload.response_url, {
            attachments,
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

    await submitJobAndReturn({ job, args: rest, immediate, response: resp });
    return;
});


async function submitJobAndReturn(options: { job: JobRequest, immediate: boolean, response: functions.Response, args?: string[] }): Promise<void> {
    const { job, immediate, response, args } = options;
    logger.log("Job built:", JSON.stringify(job, null, 2));

    const slackCmdName = `${ job.type } ${ args }`.trim();
    if (!immediate) {
        logger.log("Not immediate - sending to pubsub");
        const pubsub = new PubSub();
        await pubsub.topic(PubSubTopic.slack_command).publishJSON(job);

        response.status(200).send({ text: `:hourglass_flowing_sand: Processing Job \`${ slackCmdName }\`` });
        response.end();
    } else {
        logger.warn("Processing slack command immediately");
        try {
            await processJob(job);
        } catch (error) {
            logger.error("failed to process job immediately", error);
            response.status(200).send({ text: `Error Processing Job \`${ slackCmdName }\`: \n\`${ JSON.stringify(job) }\`\n\`${ JSON.stringify(error.message || error, null, 2) }\`` });
        }
    }
    return;
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
    logger.log('body: ', JSON.stringify(payload, null, 2));
    if (callbackId === 'get_mailchimp_member') {
        await AdminSlackService.getSharedInstance().sendToResponseUrl(payload.response_url, { text: "This doesnt do anything useful... yet" });

        resp.send({ success: true });
    } else {
        resp.sendStatus(400);
    }
});

export default app;