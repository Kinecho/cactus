import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import * as crypto from "crypto";
import * as Sentry from "@sentry/node";
import { getConfig } from "@admin/config/configService";
import { differenceInMinutes } from "@shared/util/DateUtil";
import { handleWebhookEvent } from "@api/flamelink/WebhookHandler";
import Logger from "@shared/Logger";
import { SentryExpressHanderConfig } from "@api/util/RequestUtil";

const logger = new Logger("flamelinkEndpoints");
const config = getConfig();
const app = express();

app.use(Sentry.Handlers.requestHandler(SentryExpressHanderConfig) as express.RequestHandler);

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
    try {
        const headers = req.headers;
        const signatureHeader = headers[FlamelinkHeader.signature] as string | undefined;
        if (!signatureHeader) {
            logger.log("FLAMELINK REQUEST HAS NO SIGNATURE - UNAUTHORIZED");
            resp.sendStatus(401);
            return
        }

        const [timestampPart, signaturePart] = signatureHeader.split(",");
        const [, timestamp] = timestampPart.split("=");
        const [, signature] = signaturePart.split("=");
        logger.log(`processing signature header value timestamp=${ timestamp } | signature=${ signature }`);


        const base = `${ timestamp }.${ req.rawBody }`;
        const hash = crypto.createHmac('sha256', config.flamelink.service_account.private_key).update(base).digest('hex');

        const verified = hash === signature;


        if (!verified) {
            logger.log("signature invalid, returning 403");
            resp.sendStatus(403);
            return
        }

        logger.log("signature valid, checking timestamp");

        // request originated from Flamelink

        // Optionally check timestamp against current timestamp
        const TOLERANCE_MINUTES = 5;
        const currentDate = new Date();
        const compareDate = new Date(Number(timestamp));
        logger.log("compareDate", compareDate);

        const diffMinutes = differenceInMinutes(currentDate, compareDate);
        logger.log("Timestamp difference is ", diffMinutes, "minutes");
        if (diffMinutes <= TOLERANCE_MINUTES && diffMinutes >= 0) {
            // Request within tolerance difference
            logger.log("Request is within 5 minute tolerance window");
            next();
            return
        } else {
            logger.log("request timestmap is out of range");
            resp.status(412); //precondition failed
            resp.send({ message: `The request's timestamp is not within the tolerance window of 5 minutes. The request's timestamp was ${ diffMinutes } old` });
            return;
        }
    } catch (error) {
        logger.error(error);
        resp.status(500).send({success: false, error: error.message})
    }
};

app.use(signatureHandler);

app.use(cors({origin: config.allowedOrigins}));

app.get('/', (req, res) => res.status(200).json({status: 'ok'}));

app.post("/webhook", async (req: functions.https.Request | any, resp: functions.Response) => {
    try {
        resp.contentType("application/json");
        logger.log("received Flamelink webhook\n", JSON.stringify(req.body, null, 2));

        const headers = req.headers;
        const retryCount = headers[FlamelinkHeader.retryCount];
        const isLiveMode = Boolean(headers[FlamelinkHeader.livemode]);
        const eventType = headers[FlamelinkHeader.eventType];


        logger.log("retry count", retryCount);
        logger.log("eventType", eventType);

        if (!isLiveMode) {
            resp.send({ message: "Not live mode, not processing event", success: true })
        }

        const result = await handleWebhookEvent(req.body, eventType);


        resp.send(result);
        logger.log("sent response", JSON.stringify(result, null, 2))
    } catch (error) {
        logger.error(error);
        resp.status(500).send({success: false, error: error.message})
    }
});

app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

export default app;