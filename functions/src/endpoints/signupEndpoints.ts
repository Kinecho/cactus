import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
    EmailStatusRequest,
    EmailStatusResponse,
    LoginEvent,
    MagicLinkRequest,
    MagicLinkResponse,
} from "@shared/api/SignupEndpointTypes";
import AdminSlackService, {
    ChannelName,
    ChatMessage,
    SlackAttachment,
    SlackAttachmentField
} from "@admin/services/AdminSlackService";
import { getConfig } from "@admin/config/configService";
import * as Sentry from "@sentry/node";
import AdminSendgridService from "@admin/services/AdminSendgridService";
import { appendDomain, appendQueryParams, getProviderDisplayName } from "@shared/util/StringUtil";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminPendingUserService from "@admin/services/AdminPendingUserService";
import AdminSocialInviteService from "@admin/services/AdminSocialInviteService";
import AdminUserService from "@admin/services/AdminUserService";
import MailchimpService from "@admin/services/MailchimpService";
import { getAuthUser } from "@api/util/RequestUtil";
import UserRecord = admin.auth.UserRecord;
import ActionCodeSettings = admin.auth.ActionCodeSettings;
import { getISODateTime } from "@shared/util/DateUtil";
import { QueryParam } from "@shared/util/queryParams";
import Logger from "@shared/Logger";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import AdminRevenueCatService from "@admin/services/AdminRevenueCatService";
import { getAppEmoji } from "@shared/util/ReflectionResponseUtil";

const logger = new Logger("signupEndpoints");
const Config = getConfig();

const app = express();
app.use(cors({
    origin: Config.allowedOrigins,
}));

app.post("/email-status", async (req: functions.https.Request | any, resp: functions.Response) => {

    const payload: EmailStatusRequest = req.body;
    logger.log("signupEndpoints.email-status", payload);
    let response: EmailStatusResponse | undefined = undefined;
    const email = payload.email;
    let exists = false;

    if (!email) {
        logger.error("No email was provided for the signup endpoint");
        await AdminSlackService.getSharedInstance().sendSignupsMessage({
            text: `Magic Link endpoint called with no email in payload.`
        });

        response = { exists: false, error: "No email provided", success: false, email: "" };
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
        logger.error("no user found for email", email);
    }

    await AdminSlackService.getSharedInstance().sendActivityMessage({
        text: `${ email } triggered the Magic Link flow. Existing Email = ${ exists }`
    });

    response = { exists, email };
    resp.send(response);
    return;
});


app.post("/login", async (req: functions.https.Request | any, resp: functions.Response) => {
    logger.log("handling logged in ");
    const user = await getAuthUser(req);
    if (!user) {
        resp.sendStatus(401);
        return
    }
});

app.post("/magic-link", async (req: functions.https.Request | any, resp: functions.Response) => {
    const payload: MagicLinkRequest = req.body;
    logger.log("signupEndpoints.magic-link", payload);
    const { email, referredBy } = payload;
    try {

        if (!email) {
            logger.error("signupEndpoints.magic-link: No email provided in payload");
            const errorResponse: MagicLinkResponse = {
                success: false,
                error: "No email provided",
                email: "",
                exists: false
            };
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
                logger.log("No user found for email", email);
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
            logger.log(`Found cactus member for ${ email }`);
            memberExists = true;
            displayName = member.getFullName();
        } else {
            logger.log(`no cactus member found for ${ email }`);
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
                text: `Added PendingUser \`${ pendingUser.id }\``,
            })
        }


        const fields = [{
            title: "Auth User",
            value: `${ user ? user.uid : "none" }`,
            short: true,
        }, {
            title: "Cactus Member",
            value: `${ member ? member.id : "none" }`,
            short: true,
        }];
        if (referredBy && !existingMember) {
            fields.push({
                title: "Referred By Email",
                value: `${ referredBy || "--" }`,
                short: false,
            })
        }

        attachments.push({
            fields,
        });

        const url = appendDomain(payload.continuePath, Config.web.domain);
        const sourceApp = payload.sourceApp || "web";
        const actionCodeSettings: ActionCodeSettings = {
            handleCodeInApp: true,
            url,
        };

        await AdminSlackService.getSharedInstance().sendSignupsMessage({
            text: `${ email } triggered the ${ sourceApp } Magic Link flow. Will get ${ (memberExists || userExists) ? "\`Welcome Back\`" : "\`Confirm Email\`" } email from SendGrid.`,
            attachments: attachments
        });

        logger.log(`action code settings: ${ JSON.stringify(actionCodeSettings) }`);
        try {
            let magicLink = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);
            magicLink = appendQueryParams(magicLink, { [QueryParam.SOURCE_APP]: sourceApp });
            logger.log(`Generated signing link for ${ email }: ${ magicLink }`);

            if (userExists || memberExists) {
                await AdminSendgridService.getSharedInstance().sendMagicLink({
                    displayName,
                    email,
                    link: magicLink,
                    sourceApp: sourceApp
                });
            } else {
                await AdminSendgridService.getSharedInstance().sendMagicLinkNewUser({
                    displayName,
                    email,
                    link: magicLink,
                    sourceApp: sourceApp
                });
            }

            resp.send(response);
        } catch (error) {
            Sentry.captureException(error);
            logger.error(error);
            await AdminSlackService.getSharedInstance().uploadTextSnippet({
                message: `Failed to send magic link to ${ email }`,
                data: stringifyJSON({ error, continueUrl: url }, 2),
                fileType: "json",
                channel: ChannelName.engineering,
                filename: `failed-magic-link-${ new Date().toISOString() }.json`

            });
            resp.status(500).send({
                exists: userExists || memberExists,
                email,
                sendSuccess: false,
                error: error,
            });
        }


        return;

    } catch (error) {
        logger.error("Failed to generate magic link");
        resp.status(500).send({ sendSuccess: false, error: error.message, email: email });
        return
    }
});

app.post("/login-event", async (req: functions.https.Request | any, resp: functions.Response) => {
    try {
        logger.log("Handling login event");
        const requestUser = await getAuthUser(req);
        if (!requestUser) {
            logger.log("No auth user was found on the request");
            resp.sendStatus(401);
            return
        }

        const payload: LoginEvent = req.body;

        const { userId, isNewUser, providerId, referredByEmail, reflectionResponseIds = [], app: appType } = payload;

        if (!userId) {
            logger.warn("No user Id was provided in the body fo the request");
            resp.status(400).send({ message: "You muse provide as user ID in the body of the request" });
            return;
        }


        if (requestUser.uid !== userId) {
            logger.warn(`The auth user on the request did not match the payload. Request User ID = ${ requestUser.uid } | payloadUserId = ${ userId }`);
            resp.sendStatus(403);
            return
        }

        const fields: SlackAttachmentField[] = [];

        const attachments: SlackAttachment[] = [];
        const message: ChatMessage = { text: "A user has logged in.", attachments, didSignup: false };


        const [user, member] = await Promise.all([
            AdminUserService.getSharedInstance().getById(userId),
            AdminCactusMemberService.getSharedInstance().getMemberByUserId(userId)
        ]);

        const trialStartedAt = member?.subscription?.trial?.startedAt;
        const trialEndAt = member?.subscription?.trial?.endsAt;
        logger.info("typeof trial.startedAt = ", typeof (trialStartedAt));
        logger.info("typeof trial.endAt = ", typeof (trialEndAt));

        if (!user) {
            resp.status(400).send({ message: `Unable to find a user for userId ${ userId }` });
            return;
        }

        const previousLoginDate = user.lastLoginAt;

        if (previousLoginDate) {
            fields.push({ title: "Last Logged In", value: getISODateTime(previousLoginDate) });
        }

        if (providerId && !user.providerIds.includes(providerId)) {
            user.providerIds.push(providerId);
        }
        user.lastLoginAt = new Date();
        await AdminUserService.getSharedInstance().save(user);

        message.text = `${ appType ? getAppEmoji(appType) : "" } ${ user.email } logged in with ${ getProviderDisplayName(providerId) } ${ AdminSlackService.getProviderEmoji(providerId) }`.trim();

        if (user.email) {
            logger.log("checking for pending user so we can grab the reflectionResponseIds from it");

            const pendingUser = await AdminPendingUserService.getSharedInstance().completeSignup({
                userId,
                email: user.email
            });

            if (pendingUser) {
                if (pendingUser.reflectionResponseIds.length > 0) {
                    reflectionResponseIds.push(...pendingUser.reflectionResponseIds);
                    fields.push({ title: "Pending User's Reflections", value: `${ reflectionResponseIds.length }` });
                }
            }
        }


        if (isNewUser && member) {
            message.text = `${ appType ? getAppEmoji(appType) : "" }  ${ user.email } has completed their sign up  with ${ getProviderDisplayName(providerId) } ${ AdminSlackService.getProviderEmoji(providerId) }`.trim();
            message.didSignup = true;
            await AdminUserService.getSharedInstance().setReferredByEmail({
                userId,
                referredByEmail: referredByEmail || undefined
            });

            const accountAttachment: SlackAttachment = { fields, color: "good" };
            member.referredByEmail = referredByEmail || undefined;
            member.signupQueryParams = { ...payload.signupQueryParams, ...member.signupQueryParams };

            await AdminCactusMemberService.getSharedInstance().save(member);

            logger.log(`set referred by ${ referredByEmail } on ${ member.email || "unknown" }`);

            const invitedByMember = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(referredByEmail);
            await AdminSocialInviteService.getSharedInstance().handleMemberJoined(member, invitedByMember);

            if (member.email && referredByEmail) {
                logger.log("Updating mailchimp ref email to ", referredByEmail);
                await MailchimpService.getSharedInstance().updateMergeFields({
                    email: member.email,
                    mergeFields: { REF_EMAIL: referredByEmail }
                });

                fields.push({
                    title: "Referred By",
                    value: referredByEmail
                })
            }

            fields.push({
                title: "Source / Medium",
                value: `${ member.getSignupSource() || "--" } / ${ member.getSignupMedium() || "--" }`
            });


            attachments.push(accountAttachment);
        } else if (!member) {
            fields.push({
                title: "No Member Found",
                value: "User Trigger probably didn't finish processing.",
            })
        } else {
            logger.log("this was not a new user");
        }

        const memberId = member?.id;
        if (memberId) {
            await AdminRevenueCatService.shared.updateLastSeen({ memberId, appType, updateLastSeen: true });
            await AdminRevenueCatService.shared.updateSubscriberAttributes(member);
        }

        if (message.didSignup) {
            await AdminSlackService.getSharedInstance().sendSignupsMessage(message);
        } else {
            await AdminSlackService.getSharedInstance().sendActivityMessage(message);
        }
        resp.sendStatus(204);
    } catch (error) {
        logger.error("An unexpected error occurred while processing the login-event");
        resp.sendStatus(500)
    }

});

export default app;