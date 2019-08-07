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
import {appendDomain, getFullName} from "@shared/util/StringUtil";
import UserRecord = admin.auth.UserRecord;
import ActionCodeSettings = admin.auth.ActionCodeSettings;
import CactusMember from "@shared/models/CactusMember";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";

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
    let userExists = false;
    let memberExists = false;
    let user: UserRecord | undefined | null = undefined;
    let member: CactusMember | undefined = undefined;
    let displayName: string | undefined;
    try {
        user = await admin.auth().getUserByEmail(email);
        if (user) {
            displayName = user.displayName || undefined;
            userExists = true;
        }
    } catch (e) {
        console.error("no user found for email", email);
    }

    if (!user) {
        console.log(`No user was found for ${email}, attempting to find cactusMember `);
        member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email);
        if (member) {
            console.log(`Found cactus member for ${email}`);
            memberExists = true;
            displayName = getFullName(member);
        } else {
            console.log(`no cactus member found for ${email}`);
        }
    }

    await AdminSlackService.getSharedInstance().sendActivityMessage({
        text: `${email} triggered the Magic Link flow. Will get ${(memberExists || userExists) ? "\`Welcome Back\`" : "\`Confirm Email\`"} email from SendGrid.`,
        attachments: [{
            fields: [{
                title: "Auth User",
                value: `${user ? user.uid : "none"}`,
                short: true,
            }, {
                title: "Cactus Member",
                value: `${member ? member.id : "none"}`,
                short: true,
            }]
        }]
    });

    const url = appendDomain(payload.continuePath, Config.web.domain);

    const actionCodeSettings: ActionCodeSettings = {
        handleCodeInApp: true,
        url,
    };

    console.log(`action code settings: ${JSON.stringify(actionCodeSettings)}`);
    try {
        const link = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);

        console.log(`Generated signing link for ${email}: ${link}`);

        let emailSendSuccess = false;
        if (userExists || memberExists) {
            emailSendSuccess = await AdminSendgridService.getSharedInstance().sendMagicLink({displayName, email, link: link});
        } else {
            emailSendSuccess = await AdminSendgridService.getSharedInstance().sendMagicLinkNewUser({displayName, email, link: link});
        }

        const response: MagicLinkResponse = {
            exists: userExists || memberExists,
            email,
            sendSuccess: emailSendSuccess
        };
        resp.send(response);

    } catch (error) {
        Sentry.captureException(error);
        console.error(error);

        resp.status(500).send({
            exists: userExists || memberExists,
            email,
            sendSuccess: false,
            error: error,
        });
    }

    return;
});


export default app;