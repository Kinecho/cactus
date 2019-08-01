import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
    EmailStatusRequest,
    EmailStatusResponse,
    MagicLinkRequest,
    MagicLinkResponse
} from "@shared/api/SignupEndpointTypes";
import AdminSlackService from "@shared/services/AdminSlackService";
import {getConfig} from "@api/config/configService";
import * as Sentry from "@sentry/node";
import AdminSendgridService from "@shared/services/AdminSendgridService";
import {appendDomain} from "@shared/util/StringUtil";
import UserRecord = admin.auth.UserRecord;
import ActionCodeSettings = admin.auth.ActionCodeSettings;

const Config = getConfig();

const app = express();
app.use(cors({origin: true}));

app.post("/email-status", async (req: functions.https.Request | any, resp: functions.Response) => {

    const payload: EmailStatusRequest = req.body;

    const email = payload.email;
    let exists = false;
    let user: UserRecord | undefined | null = undefined;
    try {
        user = await admin.auth().getUserByEmail(email);
        if (user) {
            exists = true;
        }

    } catch (e) {
        console.error("no user found for email", email);
    }

    await AdminSlackService.getSharedInstance().sendActivityMessage({
        text: `${email} triggered the Magic Link flow. Existing Email = ${exists}`
    });

    const response: EmailStatusResponse = {exists, email};


    resp.send(response);
    return;
});


app.post("/magic-link", async (req: functions.https.Request | any, resp: functions.Response) => {

    const payload: MagicLinkRequest = req.body;

    const email = payload.email;
    let exists = false;
    let user: UserRecord | undefined | null = undefined;
    let displayName: string | undefined;
    try {
        user = await admin.auth().getUserByEmail(email);
        if (user) {
            displayName = user.displayName || undefined;
            exists = true;
        }

    } catch (e) {
        console.error("no user found for email", email);
    }

    await AdminSlackService.getSharedInstance().sendActivityMessage({
        text: `${email} triggered the Magic Link flow. Existing Email = ${exists}`
    });

    // const parsed = stripQueryParams(payload.continuePath);
    const url = appendDomain(payload.continuePath, Config.web.domain);

    // url = url + encodeURIComponent("?" + queryString.stringify(parsed.query));

    const actionCodeSettings: ActionCodeSettings = {
        handleCodeInApp: true,
        // dynamicLinkDomain: Config.dynamic_links.domain,
        // dynamicLinkDomain: "cactus-app-stage.web.app",
        url,
        // iOS: {
        //     bundleId: Config.ios.bundle_id,
        // }
    };

    console.log("action code settings:", JSON.stringify(actionCodeSettings, null, 2));
    try {
        const link = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);


        // const combinedLink = appendQueryParams(link, parsed.query);

        console.log(`Generated signing link for ${email}: ${link}`);

        await AdminSendgridService.getSharedInstance().sendMagicLink({displayName, email, link: link});

        const response: MagicLinkResponse = {
            exists,
            email,
            sendSuccess: true
        };
        resp.send(response);

    } catch (error) {
        Sentry.captureException(error);
        console.error(error);

        resp.status(500).send({
            exists,
            email,
            sendSuccess: false,
            error: error,
        });
    }

    return;
});


export default app;