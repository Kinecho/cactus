import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import * as crypto from "crypto";
import chalk from "chalk";
import {getConfig} from "@admin/config/configService";
import {differenceInMinutes} from "@shared/util/DateUtil";
import {handleWebhookEvent} from "@api/flamelink/WebhookHandler";


const config = getConfig();
const app = express();

enum FlamelinkHeader {
    signature = "x-flamelink-signature",
    eventType = "x-flamelink-event-type",
    projectId = "x-flamelink-project-id",
    webhookId = "x-flamelink-webhook-id",
    livemode = "x-flamelink-livemode",
    retryCount = "x-flamelink-retry-count",
    authorization = "authorization"
}

const signatureHandler = (req: functions.https.Request | any, resp: functions.Response, next: Function) => {
    const headers = req.headers;
    const signatureHeader = headers[FlamelinkHeader.signature] as string | undefined;
    if (!signatureHeader) {
        console.log(chalk.yellow("FLAMELINK REQUEST HAS NO SIGNATURE - UNAUTHORIZED"));
        resp.sendStatus(401);
        return
    }

    const [timestampPart, signaturePart] = signatureHeader.split(",");
    const [, timestamp] = timestampPart.split("=");
    const [, signature] = signaturePart.split("=");
    console.log(`processing signature header value timestamp=${timestamp} | signature=${signature}`);


    const base = `${timestamp}.${req.rawBody}`;
    const hash = crypto.createHmac('sha256', config.flamelink.service_account.private_key).update(base).digest('hex');

    const verified = hash === signature;


    if (!verified) {
        console.log(chalk.red("signature invalid, returning 403"));
        resp.sendStatus(403);
        return
    }

    console.log(chalk.green("signature valid, checking timestamp"));

    // request originated from Flamelink

    // Optionally check timestamp against current timestamp
    const TOLERANCE_MINUTES = 5;
    const currentDate = new Date();
    const compareDate = new Date(Number(timestamp));
    console.log("compareDate", compareDate);

    const diffMinutes = differenceInMinutes(currentDate, compareDate);
    console.log("Timestamp difference is ", diffMinutes, "minutes");
    if (diffMinutes <= TOLERANCE_MINUTES && diffMinutes >= 0) {
        // Request within tolerance difference
        console.log("Request is within 5 minute tolerance window");
        next();
        return
    } else {
        console.log("request timestmap is out of range");
        resp.status(412); //precondition failed
        resp.send({message: `The request's timestamp is not within the tolerance window of 5 minutes. The request's timestamp was ${diffMinutes} old`});
        return;
    }
};

app.use(signatureHandler);

app.use(cors({origin: true}));

app.get('/', (req, res) => res.status(200).json({status: 'ok'}));

app.post("/webhook", async (req: functions.https.Request | any, resp: functions.Response) => {
    resp.contentType("application/json");
    console.log("received Flamelink webhook\n", chalk.gray(JSON.stringify(req.body, null, 2)));

    const headers = req.headers;
    const retryCount = headers[FlamelinkHeader.retryCount];
    const isLiveMode = Boolean(headers[FlamelinkHeader.livemode]);
    const eventType = headers[FlamelinkHeader.eventType];


    console.log("retry count", retryCount);
    console.log("eventType", eventType);

    if (!isLiveMode) {
        resp.send({message: "Not live mode, not processing event", success: true})
    }

    const result = await handleWebhookEvent(req.body, eventType);


    resp.send(result);
    console.log(chalk.green("sent response", JSON.stringify(result, null, 2)))

});


export default app;