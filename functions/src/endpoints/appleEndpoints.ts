import Logger from "@shared/Logger";
import { getConfig } from "@admin/config/configService";
import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import * as Sentry from "@sentry/node";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import { isAppleServerNotification, isCompletePurchaseRequest } from "@shared/api/AppleApi";
import { getAuthUserId, SentryExpressHanderConfig } from "@api/util/RequestUtil";
import AppleService from "@admin/services/AppleService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminSlackService, { ChannelName } from "@admin/services/AdminSlackService";

const logger = new Logger("appleEndpoints");
const Config = getConfig();
const app = express();
app.use(Sentry.Handlers.requestHandler(SentryExpressHanderConfig) as express.RequestHandler);

app.use(cors({
    origin: Config.allowedOrigins,
}));

app.post("/complete-purchase", async (req: functions.https.Request | any, resp: functions.Response) => {
    try {
        const body = req.body;
        logger.info("verify receipt called");
        const userId = await getAuthUserId(req);
        if (!userId) {
            logger.info("Call to complete-purchase was not authenticated. returning 401");
            resp.status(401).send({ success: false, error: "You must be logged in to verify a receipt" });
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
        const isRestored = body.restored;
        let purchaseType = "purchased or restored";
        if (isRestored === true) {
            purchaseType = "restored"
        } else if (isRestored === false) {
            purchaseType = "purchased";
        }
        const result = await AppleService.getSharedInstance().fulfillApplePurchase({ receipt: body, userId });

        const product = result.fulfillmentResult?.subscriptionProduct;
        if (result.success && result.fulfillmentResult?.didFulfill) {
            await AdminSlackService.getSharedInstance().sendChaChingMessage({ text: `:ios: ${ member?.email } has ${ purchaseType } a subscription \`${ product?.displayName } (${ product?.appleProductId })\`. Purchase Price: ${ body.localePriceFormatted ?? "not set" }` });
        } else if (result.success) {
            await AdminSlackService.getSharedInstance().sendChaChingMessage({ text: `:ios: ${ member?.email } was unable to fulfill a \`${ purchaseType }\` receipt\n>${ result.message }` });
        }

        logger.info("Verify receipt completed", stringifyJSON(result));
        resp.status(200).send(result);
        return
    } catch (error) {
        logger.error(error);
        resp.status(500).send({success: false, error: error.message});
    }
});


app.post("/subscription-status", async (req: functions.https.Request | any, resp: functions.Response) => {
    try {
        const notification = req.body;
        logger.info("Processing Subscription Status Update notification", JSON.stringify(notification, null, 2));

        if (!isAppleServerNotification(notification)) {
            resp.sendStatus(400);
            return
        }

        if (notification.password !== Config.ios.iap_shared_secret) {
            logger.error("The password provided on the apple subscription status endpoint did not match the shared secret in the Cactus Config");
            await AdminSlackService.getSharedInstance().uploadTextSnippet({
                channel: ChannelName.engineering,
                message: "The password provided on the apple subscription status endpoint did not match the shared secret in the Cactus Config",
                data: stringifyJSON(notification, 2),
                fileType: "json",
                filename: "Failed Apple Server-to-ServerNotification.json",
            });
            resp.sendStatus(401);
            return;
        }

        const result = await AppleService.getSharedInstance().handleSubscriptionNotification(notification);
        if (result.success) {
            resp.sendStatus(200);
        } else {
            logger.error("failed to process notification");
            resp.sendStatus(500);
        }

        return
    } catch (error) {
        logger.error(error);
        resp.status(500).send({success: false, error: error.message});
    }
});

app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);
export default app;