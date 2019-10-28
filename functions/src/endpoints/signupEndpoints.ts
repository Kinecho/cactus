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
import AdminSlackService, {ChatMessage, SlackAttachment, SlackAttachmentField} from "@admin/services/AdminSlackService";
import {getConfig} from "@api/config/configService";
import * as Sentry from "@sentry/node";
import AdminSendgridService from "@admin/services/AdminSendgridService";
import {appendDomain, getFullName, getProviderDisplayName} from "@shared/util/StringUtil";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminPendingUserService from "@admin/services/AdminPendingUserService";
import AdminUserService from "@admin/services/AdminUserService";
import MailchimpService from "@admin/services/MailchimpService";
import {getAuthUser} from "@api/util/RequestUtil";
import UserRecord = admin.auth.UserRecord;
import ActionCodeSettings = admin.auth.ActionCodeSettings;
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import {getISODateTime} from "@shared/util/DateUtil";

const Config = getConfig();

const app = express();
app.use(cors({origin: true}));

app.post("/email-status", async (req: functions.https.Request | any, resp: functions.Response) => {

    const payload: EmailStatusRequest = req.body;
    console.log("signupEndpoints.email-status", payload);
    const email = payload.email;
    let exists = false;

    if (!email) {
        console.error("No email was provided for the signup endpoint");
        await AdminSlackService.getSharedInstance().sendActivityMessage({
            text: `Magic Link endpoint called with no email in payload.`
        });

        let response: EmailStatusResponse = {exists: false, error: "No email provided", success: false, email: ""};
        resp.send(response);
        return

    }

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


app.post("/login", async (req: functions.https.Request | any, resp: functions.Response) => {
    console.log("handling logged in ");


    const user = await getAuthUser(req);

    if (!user) {
        resp.sendStatus(401);
        return
    }


});

app.post("/magic-link", async (req: functions.https.Request | any, resp: functions.Response) => {

    const payload: MagicLinkRequest = req.body;
    console.log("signupEndpoints.magic-link", payload);

    const {email, referredBy} = payload;

    if (!email) {
        console.error("signupEndpoints.magic-link: No email provided in payload");
        const response: MagicLinkResponse = {success: false, error: "No email provided", email: "", exists: false}
        resp.send(response);
        return;
    }

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

    if (!existingMember) {
        const pendingUser = await AdminPendingUserService.getSharedInstance().addPendingSignup({
            email,
            referredByEmail: referredBy,
            reflectionResponseIds: payload.reflectionResponseIds,
            queryParams: payload.queryParams,
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
    if (referredBy && !existingMember) {
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

app.post("/login-event", async (req: functions.https.Request | any, resp: functions.Response) => {
    try {
        console.log("Handling login event");
        const requestUser = await getAuthUser(req);
        if (!requestUser) {
            console.log("No auth user was found on the request");
            resp.sendStatus(401);
            return
        }

        const payload: LoginEvent = req.body;

        const {userId, isNewUser, providerId, referredByEmail, reflectionResponseIds = []} = payload;

        if (!userId) {
            console.warn("No user Id was provided in the body fo the request");
            resp.status(400).send({message: "You muse provide as user ID in the body of the request"});
            return;
        }


        if (requestUser.uid !== userId) {
            console.warn(`The auth user on the request did not match the payload. Request User ID = ${requestUser.uid} | payloadUserId = ${userId}`);
            resp.sendStatus(403);
            return
        }

        const fields: SlackAttachmentField[] = [];

        const attachments: SlackAttachment[] = [];
        const message: ChatMessage = {text: "A user has logged in.", attachments};


        const [user, member] = await Promise.all([
            AdminUserService.getSharedInstance().getById(userId),
            AdminCactusMemberService.getSharedInstance().getMemberByUserId(userId)
        ]);


        if (!user) {
            resp.status(400).send({message: `Unable to find a user for userId ${userId}`});
            return;
        }

        const previousLoginDate = user.lastLoginAt;
        user.lastLoginAt = new Date();
        await AdminUserService.getSharedInstance().save(user);
        if (previousLoginDate) {
            fields.push({title: "Last Logged In", value: getISODateTime(previousLoginDate)});
        }

        if (providerId && !user.providerIds.includes(providerId)) {
            user.providerIds.push(providerId);
        }
        message.text = `${user.email} logged in with ${getProviderDisplayName(providerId)} ${AdminSlackService.getProviderEmoji(providerId)}`;

        if (user.email) {
            console.log("checking for pending user so we can grab the reflectionResponseIds from it");

            const pendingUser = await AdminPendingUserService.getSharedInstance().completeSignup({
                userId,
                email: user.email
            });

            if (pendingUser) {
                if (pendingUser.reflectionResponseIds.length > 0) {
                    reflectionResponseIds.push(...pendingUser.reflectionResponseIds);
                    fields.push({title: "Pending User's Reflections", value: `${reflectionResponseIds.length}`});
                }
            }
        }


        if (isNewUser && member) {
            message.text = `${user.email} has completed their sign up  with ${getProviderDisplayName(providerId)} ${AdminSlackService.getProviderEmoji(providerId)}`;
            await AdminUserService.getSharedInstance().setReferredByEmail({
                userId,
                referredByEmail: referredByEmail || undefined
            });

            const accountAttachment: SlackAttachment = {fields, color: "good"};
            member.referredByEmail = referredByEmail || undefined;
            member.signupQueryParams = Object.assign(member.signupQueryParams, payload.signupQueryParams);
            await AdminCactusMemberService.getSharedInstance().save(member);
            console.log(`set referred by ${referredByEmail} on ${member.email || "unknown"}`);

            if (member.email && referredByEmail) {
                console.log("Updating mailchimp ref email to ", referredByEmail);
                await MailchimpService.getSharedInstance().updateMergeFields({
                    email: member.email,
                    mergeFields: {REF_EMAIL: referredByEmail}
                });

                fields.push({
                    title: "Referred By",
                    value: referredByEmail
                })
            }

            fields.push({
                title: "Source / Medium",
                value: `${member.getSignupSource() || "--"} / ${member.getSignupMedium() || "--"}`
            });


            attachments.push(accountAttachment);
        } else if (!member) {
            fields.push({
                title: "No Member Found",
                value: "User Trigger probably didn't finish processing.",
            })
        } else {
            console.log("this was not a new user");
        }


        if (member && reflectionResponseIds.length > 0) {
            await AdminSentPromptService.getSharedInstance().createSentPromptsFromReflectionResponseIds({
                reflectionResponseIds,
                member,
                userId: userId,
            });

            attachments.push({
                title: `Added ${reflectionResponseIds.length} Anonymous Reflections to their account`,
                color: "good"
            });
        }

        await AdminSlackService.getSharedInstance().sendActivityMessage(message);
        resp.sendStatus(204);
    } catch (error) {
        console.error("An unexpected error occurred while processing the login-event");
        resp.sendStatus(500)
    }

});


export default app;