import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
    ChangeEmailRequest,
    ChangeEmailResponse,
    ChangeEmailResponseCode,
    EmailStatusRequest,
    EmailStatusResponse,
    LoginEvent,
    MagicLinkRequest,
    MagicLinkResponse,
} from "@shared/api/SignupEndpointTypes";
import AdminSlackService, {ChatMessage, SlackAttachment, SlackAttachmentField} from "@admin/services/AdminSlackService";
import {getConfig} from "@admin/config/configService";
import * as Sentry from "@sentry/node";
import AdminSendgridService from "@admin/services/AdminSendgridService";
import {appendDomain, appendQueryParams, getProviderDisplayName, isValidEmail} from "@shared/util/StringUtil";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminPendingUserService from "@admin/services/AdminPendingUserService";
import AdminSocialInviteService from "@admin/services/AdminSocialInviteService";
import AdminUserService from "@admin/services/AdminUserService";
import MailchimpService from "@admin/services/MailchimpService";
import {getAuthUser} from "@api/util/RequestUtil";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import {getISODateTime} from "@shared/util/DateUtil";
import {QueryParam} from "@shared/util/queryParams";
import UserRecord = admin.auth.UserRecord;
import ActionCodeSettings = admin.auth.ActionCodeSettings;

const Config = getConfig();

const app = express();
app.use(cors({origin: true}));

app.post("/change-email", async (req: functions.https.Request | any, resp: functions.Response) => {
    console.log("Starting change-email with request body body", JSON.stringify(req.body));
    const authUser = await getAuthUser(req);

    if (!authUser) {
        console.error("the user is not authenticated");
        resp.sendStatus(401);
        return;
    }

    const payload = req.body as ChangeEmailRequest;
    const {newEmail} = payload;
    console.log(`Processing email change request for user ${authUser.email} (userId=${authUser.uid}). New email = ${newEmail}`);
    if (!isValidEmail(newEmail)) {
        console.warn(`the provided email "${newEmail}" is not a valid email address. Returning 400`);
        const errorResponse: ChangeEmailResponse = {
            newEmail,
            confirmationEmailSent: false,
            emailAvailable: false,
            error: new Error(`"${newEmail}" is not a valid email address.`),
            code: ChangeEmailResponseCode.INVALID_EMAIL
        };
        resp.status(400).send(errorResponse);
        return;
    }

    const [users] = await Promise.all([
        AdminUserService.getSharedInstance().getAllMatchingEmail(newEmail),

    ]);

    console.log(`Found ${users.length} users with the email address of ${newEmail}`);

    resp.sendStatus(500);
    return;
});

app.post("/email-status", async (req: functions.https.Request | any, resp: functions.Response) => {

    const payload: EmailStatusRequest = req.body;
    console.log("signupEndpoints.email-status", payload);
    let response: EmailStatusResponse | undefined = undefined;
    const email = payload.email;
    let exists = false;

    if (!email) {
        console.error("No email was provided for the signup endpoint");
        await AdminSlackService.getSharedInstance().sendActivityMessage({
            text: `Magic Link endpoint called with no email in payload.`
        });

        response = {exists: false, error: "No email provided", success: false, email: ""};
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

    response = {exists, email};
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
        const errorResponse: MagicLinkResponse = {success: false, error: "No email provided", email: "", exists: false};
        resp.send(errorResponse);
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
        displayName = member.getFullName();
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
    const sourceApp = payload.sourceApp || "web";
    const actionCodeSettings: ActionCodeSettings = {
        handleCodeInApp: true,
        url,
    };

    console.log(`action code settings: ${JSON.stringify(actionCodeSettings)}`);
    try {
        let magicLink = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);
        magicLink = appendQueryParams(magicLink, {[QueryParam.SOURCE_APP]: sourceApp});
        console.log(`Generated signing link for ${email}: ${magicLink}`);

        if (userExists || memberExists) {
            await AdminSendgridService.getSharedInstance().sendMagicLink({
                displayName,
                email,
                link: magicLink
            });
        } else {
            await AdminSendgridService.getSharedInstance().sendMagicLinkNewUser({
                displayName,
                email,
                link: magicLink
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

        if (previousLoginDate) {
            fields.push({title: "Last Logged In", value: getISODateTime(previousLoginDate)});
        }

        if (providerId && !user.providerIds.includes(providerId)) {
            user.providerIds.push(providerId);
        }
        user.lastLoginAt = new Date();
        await AdminUserService.getSharedInstance().save(user);

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
            member.signupQueryParams = {...payload.signupQueryParams, ...member.signupQueryParams};
            await AdminCactusMemberService.getSharedInstance().save(member);
            console.log(`set referred by ${referredByEmail} on ${member.email || "unknown"}`);

            const invitedByMember = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(referredByEmail);
            await AdminSocialInviteService.getSharedInstance().handleMemberJoined(member, invitedByMember);

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