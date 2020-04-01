import * as express from "express";
import * as cors from "cors";
import { getConfig, getHostname } from "@admin/config/configService";
import AdminUserService from "@admin/services/AdminUserService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import { getAuthUser, getAuthUserId } from "@api/util/RequestUtil";
import { DeleteUserRequest, FeatureAuthRequest } from "@shared/api/UserEndpointTypes";
import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import { QueryParam } from "@shared/util/queryParams";
import { PageRoute } from "@shared/PageRoutes";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import AdminSlackService from "@admin/services/AdminSlackService";
import Logger from "@shared/Logger";
import DownloadJournalJob from "@admin/jobs/DownloadJournalJob";

const logger = new Logger("userEndpoints");
const app = express();
const config = getConfig();

// Automatically allow cross-origin requests
app.use(cors({ origin: config.allowedOrigins }));

app.get("/download-data", async (req: functions.https.Request | any, resp: functions.Response) => {
    const userId = await getAuthUserId(req);

    if (!userId) {
        resp.sendStatus(401);
        return;
    }

    // const userId = "IwM9B6sefBfMtWHEGMbhZ5BC7C02";
    const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(userId);
    if (!member) {
        resp.sendStatus(403);
        return;
    }

    const job = new DownloadJournalJob({ member });
    const journal = await job.fetchData();

    resp.append("Content-Disposition", "attachment; filename=user_data.json");
    resp.status(200).send(journal);
    return;
});

app.post("/delete-permanently", async (req: functions.https.Request | any, resp: functions.Response) => {
    const requestUser = await getAuthUser(req);

    if (!requestUser?.uid) {
        logger.log("No auth user was found on the request");
        resp.sendStatus(401);
        return
    }

    const payload = req.body;
    const { email } = payload as DeleteUserRequest;

    const user = await AdminUserService.getSharedInstance().getByEmail(email);

    if (!user || user.id !== requestUser.uid) {
        logger.log("User not authorized");
        resp.sendStatus(403);
        return
    }

    if (!user?.email) {
        logger.log("User has no email address");
        resp.sendStatus(409);
        return
    }

    logger.log('Permanently deleting user... ', user.id);
    try {
        await admin.auth().deleteUser(user.id);
        logger.log('Deleted!');
        resp.status(200).send({ success: true });
        return;
    } catch (e) {
        logger.log("Error", e);
        resp.sendStatus(500);
        return
    }

    // don't expect to ever get here but just in case
    resp.sendStatus(500);
    return;
});


app.get("/feature-auth/core-values", async (req: functions.https.Request | any, resp: functions.Response) => {
    const queryParams = req.query;
    const { memberId } = queryParams as FeatureAuthRequest;
    const afterLoginUrl = `${ getHostname() }/feature-auth/core-values`;
    const loginUrl = `${ getHostname() }${ PageRoute.LOGIN }?${ QueryParam.MESSAGE }=${ encodeURIComponent("To continue to Core Values, please login.") }&${ QueryParam.REDIRECT_URL }=${ encodeURIComponent(afterLoginUrl) }`;

    if (!memberId) {
        // show an error message and instructions to upgrade
        logger.log("No memberId provided");
        resp.status(401).contentType("text/html").send('<html><body style="font-family: sans-serif; text-align: center; padding: 3rem 1rem; line-height: 150%;"><h3>To access Core Values, use must be logged-in to the latest version of Cactus.</h3><br><p><strong>iOS Users:</strong> <a style="color:#29A389" href="https://apps.apple.com/us/app/cactus-mindfulness-journal/id1474513514">Follow this link</a> to upgrade your app.<br><br>Still having problems? Email <a style="color:#29A389" href="mailto:help@cactus.app">help@cactus.app</a></p></body></html>');

        try {
            await AdminSlackService.getSharedInstance().sendActivityMessage({
                text: `Someone without a memberId tried to auth to Core Values.`
            });
        } catch (e) {
            logger.error(e);
        }

        return;
    }

    const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);

    if (!member) {
        logger.log("No member could be found for memberId: ", memberId);
        resp.redirect(loginUrl);
        return;
    }

    if (member?.tier === SubscriptionTier.PLUS && member?.email) {
        logger.log('Member is PLUS. Redirecting to Core Values survey...');
        resp.redirect('https://www.surveymonkey.com/r/core-values-v1?email=' + member.email);

        try {
            await AdminSlackService.getSharedInstance().sendActivityMessage({
                text: `PLUS member ${ member.email } authorized to Core Values`
            });
        } catch (e) {
            logger.error(e);
        }

        return;
    } else {
        const pricingUrl = `${ getHostname() }${ PageRoute.PRICING }?${ QueryParam.CORE_VALUES }=true}`;
        resp.redirect(pricingUrl);

        try {
            await AdminSlackService.getSharedInstance().sendActivityMessage({
                text: `BASIC member ${ member.email } authorized to Core Values. Redirected to Upgrade Page.`
            });
        } catch (e) {
            logger.error(e);
        }

        return;
    }

    resp.sendStatus(500);
    return;
});

export default app