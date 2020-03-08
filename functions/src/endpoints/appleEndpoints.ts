import Logger from "@shared/Logger";
import {getConfig} from "@admin/config/configService";
import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import {isVerifyReceiptParams, VerifyReceiptResult} from "@shared/api/AppleApi";
import {getAuthUserId} from "@api/util/RequestUtil";
import AppleService from "@admin/services/AppleService";

const logger = new Logger("appleEndpoints");
const Config = getConfig();
const app = express();
app.use(cors({
    origin: Config.allowedOrigins,
}));

app.post("/verify-receipt", async (req: functions.https.Request | any, resp: functions.Response<VerifyReceiptResult>) => {
    const body = req.body;
    logger.info("verify receipt called");
    const userId = getAuthUserId(req);
    if (!userId) {
        resp.status(401).send({success: false, error: "You must be logged in to verify a receipt"});
        return;
    }
    if (!isVerifyReceiptParams(body)) {
        resp.status(400).send({success: false, error: "The body was not a valid receipt param object. Please include in the format {receiptData: string}"});
        return
    }

    const result = await AppleService.getSharedInstance().verifyReceipt(body);
    resp.status(200).send(result);
    return
});


app.post("/subscription-status", async (req: functions.https.Request | any, resp: functions.Response) => {
    const body = req.body;
    logger.info("Apple Subscription status", stringifyJSON(body,2 ));

    resp.sendStatus(200);
    return
});

export default app;