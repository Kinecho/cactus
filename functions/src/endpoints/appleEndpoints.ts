import Logger from "@shared/Logger";
import { getConfig } from "@admin/config/configService";
import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import {
    AppleTransactionInfo,
    getExpirationIntentDescription,
    getExpirationIntentFromNotification,
    getOriginalTransactionIdFromServerNotification,
    isAppleServerNotification,
    isCompletePurchaseRequest
} from "@shared/api/AppleApi";
import { getAuthUserId } from "@api/util/RequestUtil";
import AppleService from "@admin/services/AppleService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminSlackService, { ChannelName } from "@admin/services/AdminSlackService";
import AdminPaymentService from "@admin/services/AdminPaymentService";
import AdminSubscriptionProductService from "@admin/services/AdminSubscriptionProductService";
import { formatDate } from "@shared/util/DateUtil";

const logger = new Logger("appleEndpoints");
const Config = getConfig();
const app = express();
app.use(cors({
    origin: Config.allowedOrigins,
}));

app.post("/complete-purchase", async (req: functions.https.Request | any, resp: functions.Response) => {
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

    const result = await AppleService.getSharedInstance().completePurchase({ receipt: body, userId });

    const product = result.fulfillmentResult?.subscriptionProduct;
    if (result.success) {
        await AdminSlackService.getSharedInstance().sendChaChingMessage({ text: `:ios: ${ member?.email } has completed an in-app purchase \`${ product?.displayName } (${ product?.appleProductId })\`` });
    } else {
        await AdminSlackService.getSharedInstance().sendChaChingMessage({ text: `${ member?.email } failed to complete a purchase on iOS\n>${ result.message }` });
    }

    logger.info("Verify receipt completed");
    resp.status(200).send(result);
    return
});


app.post("/subscription-status", async (req: functions.https.Request | any, resp: functions.Response) => {
    const notification = req.body;

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

    logger.info("Apple Subscription status", stringifyJSON(notification, 2));

    const originalTransactionId = getOriginalTransactionIdFromServerNotification(notification);
    const [payment] = await AdminPaymentService.getSharedInstance().getByAppleOriginalTransactionId(originalTransactionId);
    const [latestReceiptInfo] = notification.unified_receipt?.latest_receipt_info as (AppleTransactionInfo | undefined)[];
    const productId = latestReceiptInfo?.product_id;
    const subscriptionProduct = await AdminSubscriptionProductService.getSharedInstance().getByAppleProductId({
        appleProductId: productId,
        onlyAvailableForSale: false
    });
    const memberId = payment?.memberId as string | undefined;
    const member = memberId ? await AdminCactusMemberService.getSharedInstance().getById(memberId) : undefined;

    const isInTrial = latestReceiptInfo.is_trial_period === "true";
    const isAutoRenew = notification.auto_renew_status === "true";
    const expirationIntent = getExpirationIntentFromNotification(notification);
    const expirationDescription = getExpirationIntentDescription(expirationIntent);
    const expiresDate = latestReceiptInfo.expires_date_ms ? new Date(Number(latestReceiptInfo.expires_date_ms)) : undefined;
    await AdminSlackService.getSharedInstance().uploadTextSnippet({
        channel: ChannelName.subscription_status,
        message: `:ios: ${ member?.email || memberId } Subscription status update from Apple\n` +
        `Product = \`${ subscriptionProduct?.displayName } (${ productId })\`\n` +
        `NotificationType = \`${ notification.notification_type }\`\n` +
        `In Trial = \`${ isInTrial ? "Yes" : "No" }\`\n` +
        `Period End Date = \`${ formatDate(expiresDate) }\`` +
        `Is Auto Renew = \`${ isAutoRenew ? "Yes" : "No" }\`\n` +
        `${ expirationDescription ? "Expiration Reason = " + expirationDescription : "" }`.trim(),
        data: JSON.stringify(notification, null, 2),

        filename: `member-${ memberId }-subscription-status-update-${ new Date().toISOString() }.json`,
        fileType: "json"
    });

    resp.sendStatus(200);
    return
});

export default app;