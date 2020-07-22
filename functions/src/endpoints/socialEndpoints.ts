import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import {
    InvitationResponse,
    InvitationSendResult,
    isSocialInviteRequestBatch,
    isSocialInviteRequestSingle,
    SocialInvitePayload
} from "@shared/types/SocialInviteTypes";
import {ActivitySummaryResponse, SocialActivityFeedResponse} from "@shared/types/SocialTypes";
import {
    SocialConnectionRequestNotification,
    SocialConnectionRequestNotificationResult
} from "@shared/types/SocialConnectionRequestTypes";
import AdminSlackService, {SlackAttachment} from "@admin/services/AdminSlackService";
import {getConfig, getHostname} from "@admin/config/configService";
import * as Sentry from "@sentry/node";
import AdminSendgridService from "@admin/services/AdminSendgridService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminSocialActivityService from "@admin/services/AdminSocialActivityService";
import {getAppType, getAuthUser, getAuthUserId} from "@api/util/RequestUtil";
import AdminSocialInviteService from "@admin/services/AdminSocialInviteService";
import {PageRoute} from "@shared/PageRoutes";
import {unseenActivityCount} from "@shared/util/SocialUtil";
import Logger from "@shared/Logger";
import {EmailContact} from "@shared/types/EmailContactTypes";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import {isBlank} from "@shared/util/StringUtil";
import { getAppEmoji } from "@shared/util/ReflectionResponseUtil";

const logger = new Logger("socialEndpoints");
const Config = getConfig();
const app = express();
app.use(cors({
    origin: Config.allowedOrigins,
}));

app.post("/send-invite", async (req: functions.https.Request | any, resp: functions.Response) => {
    const requestUser = await getAuthUser(req);
    if (!requestUser || !requestUser.email) {
        logger.log("No auth user was found on the request");
        resp.sendStatus(401);
        return
    }

    const payload: SocialInvitePayload | undefined = req.body || undefined;
    logger.log("socialEndpoints.send-invite", payload);

    if (!payload) {
        logger.log("No payload was included");
        resp.sendStatus(500);
        return
    }

    const {message} = payload;
    const toContacts: EmailContact[] = [];
    if (isSocialInviteRequestBatch(payload)) {
        toContacts.push(...payload.toContacts)
    } else if (isSocialInviteRequestSingle(payload)) {
        toContacts.push(payload.toContact)
    }


    if (toContacts.length === 0) {
        logger.error("socialEndpoints.send-invite: Email to send to was not provided in payload");
        const errorResponse: InvitationResponse = {success: false, error: "No 'to' email provided", toEmails: []};
        resp.send(errorResponse);
        return;
    }

    const fromEmail = requestUser.email;
    const member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(fromEmail);
    const memberId = member?.id;

    if (!member || !memberId) {
        logger.error(`No member was found for user with email ${fromEmail} | userId = ${requestUser.uid}`);
        resp.sendStatus(403); //forbidden
        return;
    }

    const inviteResponse: InvitationResponse = {
        success: false,
        toEmails: toContacts.map(c => c.email),
        fromEmail: fromEmail,
    };

    try {
        //create the invites
        const sendInviteTasks: Promise<InvitationSendResult>[] = toContacts.map(toContact => AdminSocialInviteService.getSharedInstance().createAndSendSocialInvite({
            member,
            toContact,
            appType: payload.app,
            message
        }));

        const sendInviteResults = await Promise.all(sendInviteTasks);
        logger.info("Send Invite task results", stringifyJSON(sendInviteResults, 2));
        const errorEmails: string[] = [];
        const successContacts: string[] = [];
        const resultMap: { [email: string]: InvitationSendResult } = {};

        sendInviteResults.forEach(r => {
            resultMap[r.toEmail] = r;
            if (r.success) {
                const name = `${r.toFirstName} ${r.toLastName}`.trim();
                if (!isBlank(name)) {
                    successContacts.push(`${name} (${r.toEmail})`);
                } else {
                    successContacts.push(r.toEmail);
                }
            } else {
                errorEmails.push(r.toEmail);
            }
        });

        inviteResponse.results = resultMap;
        inviteResponse.success = true;

        // create and send slack message
        const attachments: SlackAttachment[] = [];
        if (errorEmails.length > 0) {
            attachments.push({
                text: `To Emails With Errors: \n${errorEmails.join("\n")}`,
                color: "danger"
            });
            attachments.push({
                title: "Send Results",
                text: `\`\`\`${stringifyJSON(resultMap, 2)}\`\`\``
            })
        }

        const userAgent = getAppType(req);
        logger.info("found user agent for request", userAgent);

        await AdminSlackService.getSharedInstance().sendActivityMessage({
            text: `${getAppEmoji(payload.app)} :love_letter: ${requestUser.email} sent an email invite to ${successContacts.join(", ")}`,
            attachments
        });
    } catch (error) {
        Sentry.captureException(error);
        logger.error(error);
        inviteResponse.success = false;
        inviteResponse.error = error;
    }

    resp.send(inviteResponse);

    return;
});


app.post("/notify-friend-request", async (req: functions.https.Request | any, resp: functions.Response) => {
    const requestUser = await getAuthUser(req);
    if (!requestUser || !requestUser.email) {
        logger.log("No auth user was found on the request");
        resp.sendStatus(401);
        return
    }

    const payload: SocialConnectionRequestNotification | undefined | null = req.body;
    logger.log("socialEndpoints.notify-friend-request", payload);

    if (!payload) {
        logger.log("No payload was included");
        resp.sendStatus(500);
        return
    }

    const {toEmail} = payload;

    if (!toEmail) {
        logger.error("socialEndpoints.notify-friend-request: Email to send to was not provided in payload");
        const errorResponse: SocialConnectionRequestNotificationResult = {
            success: false,
            toEmail: '',
            fromEmail: requestUser.email,
            error: "No 'to' email provided"
        };
        resp.send(errorResponse);
        return;
    }

    const member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(requestUser.email);

    const response: SocialConnectionRequestNotificationResult = {
        success: true,
        toEmail: toEmail,
        fromEmail: requestUser.email
    };

    try {
        await AdminSlackService.getSharedInstance().sendActivityMessage({
            text: `:busts_in_silhouette: ${requestUser.email} sent a friend request to ${toEmail}`
        });
    } catch (error) {
        Sentry.captureException(error);
        logger.error(error);
    }

    try {
        await AdminSendgridService.getSharedInstance().sendFriendRequest({
            toEmail: toEmail,
            fromEmail: requestUser.email,
            fromName: member ? member.getFullName() : undefined,
            link: `${getHostname()}${PageRoute.FRIENDS}`
        });

        resp.send(response);
    } catch (error) {
        Sentry.captureException(error);
        logger.error(error);

        const errorResponse: SocialConnectionRequestNotificationResult = {
            toEmail: toEmail,
            fromEmail: requestUser.email,
            success: false,
            error: error,
        }

        resp.status(500).send(errorResponse);
    }

    return;
});

app.get("/activity-feed-summary", async (req: functions.https.Request | any, resp: functions.Response) => {
    const startDate = new Date();
    const requestUserId = await getAuthUserId(req);
    const authDate = new Date();
    logger.log(`Got the auth user after ${authDate.getTime() - startDate.getTime()}`);
    logger.log("request user id is", requestUserId);
    if (!requestUserId) {
        logger.log("No auth user was found on the request");
        resp.sendStatus(401);
        return
    }

    try {
        const memberStart = new Date().getTime();
        const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(requestUserId);
        const memberEnd = new Date().getTime();
        logger.log(`Get member duration ${memberEnd - memberStart}ms`);
        const memberId = member?.id;
        if (!member || !memberId) {
            logger.error("No member or memberId found for userId", requestUserId);
            resp.sendStatus(404);
            return;
        }
        const feedEvents = await AdminSocialActivityService.getSharedInstance().getActivityFeedForMember(memberId);
        const unseenCount = unseenActivityCount({member, events: feedEvents});

        const lastFriendActivityDate = feedEvents.length > 0 ? feedEvents[feedEvents.length - 1].occurredAt : undefined;
        const response: ActivitySummaryResponse = {
            unseenCount,
            lastFriendActivityDate
        };
        const endDate = new Date();
        logger.log(`activity feed summary endpoint processed in ${endDate.getTime() - startDate.getTime()}ms`);

        resp.status(200).send(response);

    } catch (error) {
        Sentry.captureException(error);
        logger.error(error);

        const errorResponse: ActivitySummaryResponse = {
            unseenCount: 0
        };

        resp.status(500).send(errorResponse);
    }

    return;
});

app.get("/activity-feed", async (req: functions.https.Request | any, resp: functions.Response) => {
    const requestUserId = await getAuthUserId(req);
    if (!requestUserId) {
        logger.log("No auth user was found on the request");
        resp.sendStatus(401);
        return
    }

    const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(requestUserId);
    const memberId = member?.id;
    if (!member || !memberId) {
        logger.warn("No member was found for the request user id", requestUserId);
        resp.sendStatus(404);
        return;
    }

    try {
        const feedEvents = await AdminSocialActivityService.getSharedInstance().getActivityFeedForMember(memberId);

        const successResponse: SocialActivityFeedResponse = {
            success: true,
            results: feedEvents
        };

        resp.status(200).send(successResponse);

    } catch (error) {
        Sentry.captureException(error);
        logger.error(error);

        const errorResponse: SocialActivityFeedResponse = {
            success: false,
            error: error,
        };

        resp.status(500).send(errorResponse);
    }

    return;
});


export default app;