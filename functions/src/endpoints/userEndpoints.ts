import * as express from "express";
import * as cors from "cors";
import {getConfig, getHostname} from "@admin/config/configService";
import AdminUserService from "@admin/services/AdminUserService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import {getAuthUser} from "@api/util/RequestUtil";
import {DeleteUserRequest, FeatureAuthRequest} from "@shared/api/UserEndpointTypes";
import {QueryParam} from "@shared/util/queryParams";
import {PageRoute} from "@shared/PageRoutes";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Logger from "@shared/Logger";

const logger = new Logger("userEndpoints");
const app = express();
const config = getConfig();

// Automatically allow cross-origin requests
app.use(cors({origin: config.allowedOrigins}));

app.post("/delete-permanently", async (req: functions.https.Request | any, resp: functions.Response) => {
    const requestUser = await getAuthUser(req);
    
    if (!requestUser?.uid) {
        logger.log("No auth user was found on the request");
        resp.sendStatus(401);
        return
    }

    const payload = req.body;
    const {email} = payload as DeleteUserRequest;

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
        resp.status(200).send({success: true});
        return;
    } catch(e) {
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
    const {memberId} = queryParams as FeatureAuthRequest;
    const loginUrl = `${getHostname()}${PageRoute.LOGIN}?${QueryParam.MESSAGE}=${encodeURIComponent("To continue to Core Values, please login.")}`;

    if (!memberId) {
        logger.log("No memberId provided");
        resp.redirect(loginUrl);
        return;
    }

    const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);

    if (!member) {
        logger.log("No member could be found for memberId: ", memberId);
        resp.redirect(loginUrl);
        return;
    }

    if (member?.hasActiveSubscription && member?.email) {
        logger.log('Member has active subscription. Redirecting to survey...');
        resp.redirect('https://www.surveymonkey.com/r/core-values-v1?email=' + member.email);
        return;
    } else {
        const pricingUrl = `${getHostname()}${PageRoute.PAYMENT_PLANS}?${QueryParam.MESSAGE}=${encodeURIComponent("Core Values is available to Cactus Plus members.")}`;
        resp.redirect(pricingUrl);
        return;
    }

    resp.sendStatus(500);
    return;
});

export default app