import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
    EmailStatusRequest,
    EmailStatusResponse,
    LoginEvent,
    MagicLinkRequest,
    MagicLinkResponse
} from "@shared/api/SignupEndpointTypes";
import AdminSlackService, {SlackAttachment} from "@admin/services/AdminSlackService";
import {getConfig} from "@api/config/configService";
import * as Sentry from "@sentry/node";
import AdminSendgridService from "@admin/services/AdminSendgridService";
import {appendDomain, getFullName} from "@shared/util/StringUtil";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminPendingUserService from "@admin/services/AdminPendingUserService";
import AdminUserService from "@admin/services/AdminUserService";
import MailchimpService from "@admin/services/MailchimpService";
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
    resp.send(response);


    if (!existingMember) {
        const pendingUser = await AdminPendingUserService.getSharedInstance().addPendingSignup({
            email,
            referredByEmail: referredBy
        });
        attachments.push({
            text: `Added PendingUser \`${pendingUser.id}\``,
        })
    }

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

app.post("/login-event", async (req: functions.https.Request | any, resp: functions.Response) => {
    const payload: LoginEvent = req.body;
    const {userId, isNewUser, providerId, referredByEmail} = payload;
    console.log("Handling login event");
    resp.sendStatus(204);


    let message = "";

    const user = await AdminUserService.getSharedInstance().getById(userId);
    if (user) {
        user.lastLoginAt = new Date();
        if (!user.providerIds.includes(providerId)) {
            user.providerIds.push(providerId);
        }
        message = `${user.email} logged in with ${providerId}`;
    }

    if (isNewUser && referredByEmail) {
        console.log("Is new user login, and has a referral. Set it up! ");

        await AdminUserService.getSharedInstance().setReferredByEmail({userId, referredByEmail});
        console.log("Set referral email on the user");
        const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(userId);
        console.log("Found member", member, "during login-event");
        if (member && !member.referredByEmail) {
            member.referredByEmail = referredByEmail;
            await AdminCactusMemberService.getSharedInstance().save(member);
            console.log(`set referred by ${referredByEmail} on ${member.email || "unknown"}`);
            if (member.email) {
                console.log("Updating mailchimp ref email to ", referredByEmail);
                await MailchimpService.getSharedInstance().updateMergeFields({
                    email: member.email,
                    mergeFields: {REF_EMAIL: referredByEmail}
                })
            }
            message += `. Set their referredByEmail on their CactusMember to ${referredByEmail}.`;
        } else {
            message += `. Set referredByEmail on their User to ${referredByEmail}`
        }
    } else {
        console.log("No referral or this was not a new user");
    }

    await AdminSlackService.getSharedInstance().sendActivityMessage(message);

});


export default app;