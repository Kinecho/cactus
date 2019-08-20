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
import AdminSlackService, {SlackAttachment} from "@admin/services/AdminSlackService";
import {getConfig} from "@api/config/configService";
import * as Sentry from "@sentry/node";
import AdminSendgridService from "@admin/services/AdminSendgridService";
import {appendDomain, getFullName} from "@shared/util/StringUtil";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import UserRecord = admin.auth.UserRecord;
import ActionCodeSettings = admin.auth.ActionCodeSettings;
import AdminPendingUserService from "@admin/services/AdminPendingUserService";

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


    const {email, referredBy} = payload;

    let userExists = false;
    let memberExists = false;
    let displayName: string | undefined;

    const getUserTask = new Promise<UserRecord | undefined>(async (resolve) => {
        try {
            const foundUser = await admin.auth().getUserByEmail(email);
            resolve(foundUser);
        } catch (error) {
            console.log("No user found for email", email);
            resolve(undefined);
        }
    });

    const [user, member] = await Promise.all([
        getUserTask,
        AdminCactusMemberService.getSharedInstance().getMemberByEmail(email)
    ]);

    if (user) {
        displayName = user.displayName || undefined;
        userExists = true;
    }

    if (member) {
        console.log(`Found cactus member for ${email}`);
        memberExists = true;
        displayName = getFullName(member);
    } else {
        console.log(`no cactus member found for ${email}`);
    }

    const existingMember = userExists || memberExists;

    const attachments: SlackAttachment[] = [];


    /*
        Return ths response now, and finish everything afterwards, so that the user has a faster experience.
     */
    const response: MagicLinkResponse = {
        exists: userExists || memberExists,
        success: true,
        email,
    };
    //TODO: send the response here
    // resp.send(response);


    if (!existingMember) {
        const pendingUser = await AdminPendingUserService.getSharedInstance().addPendingSignup({
            email,
            referredByEmail: referredBy,
            reflectionResponseIds: payload.reflectionResponseIds
        });
        attachments.push({
            text: `Added PendingUser \`${pendingUser.id}\``,
        })
    }

    resp.send(response);

    const fields = [{
        title: "Auth User",
        value: `${user ? user.uid : "none"}`,
        short: true,
    }, {
        title: "Cactus Member",
        value: `${member ? member.id : "none"}`,
        short: true,
    }];
    if (referredBy) {
        fields.push({
            title: "Referred By Email",
            value: `${referredBy || "--"}`,
            short: false,
        })
    }

    attachments.push({
        fields,
    });
    await AdminSlackService.getSharedInstance().sendActivityMessage({
        text: `${email} triggered the Magic Link flow. Will get ${(memberExists || userExists) ? "\`Welcome Back\`" : "\`Confirm Email\`"} email from SendGrid.`,
        attachments: attachments
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

        if (userExists || memberExists) {
            await AdminSendgridService.getSharedInstance().sendMagicLink({
                displayName,
                email,
                link: link
            });
        } else {
            await AdminSendgridService.getSharedInstance().sendMagicLinkNewUser({
                displayName,
                email,
                link: link
            });
        }



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