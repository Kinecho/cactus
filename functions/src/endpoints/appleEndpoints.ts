import Logger from "@shared/Logger";
import {getConfig} from "@admin/config/configService";
import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import {isCompletePurchaseRequest, AppleCompletePurchaseResult} from "@shared/api/AppleApi";
import {getAuthUserId} from "@api/util/RequestUtil";
import AppleService from "@admin/services/AppleService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";

const logger = new Logger("appleEndpoints");
const Config = getConfig();
const app = express();
app.use(cors({
    origin: Config.allowedOrigins,
}));

app.post("/complete-purchase", async (req: functions.https.Request | any, resp: functions.Response<AppleCompletePurchaseResult>) => {
    const body = req.body;
    logger.info("verify receipt called");
    const userId = await getAuthUserId(req);
    if (!userId) {
        logger.info("Call to complete-purchase was not authenticated. returning 401");
        resp.status(401).send({success: false, error: "You must be logged in to verify a receipt"});
        return;
    }

    const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(userId);
    console.log("Cactus member id", member?.id);

    if (!isCompletePurchaseRequest(body)) {
        resp.status(400).send({
            success: false,
            error: "The body was not a valid receipt param object. Please include in the format {receiptData: string}"
        });
        return
    }

    const result = await AppleService.getSharedInstance().completePurchase({receipt: body, userId});
    logger.info("Verify receipt completed");
    resp.status(200).send(result);
    return
});


app.post("/subscription-status", async (req: functions.https.Request | any, resp: functions.Response) => {
    const body = req.body;
    logger.info("Apple Subscription status", stringifyJSON(body, 2));

    resp.sendStatus(200);
    return
});

export default app;