import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import {InvitationResponse} from "@shared/api/SignupEndpointTypes";
import {SocialInviteRequest} from "@shared/types/SocialInviteTypes";
import {ActivitySummaryResponse, SocialActivityFeedResponse} from "@shared/types/SocialTypes";
import {
    SocialConnectionRequestNotification,
    SocialConnectionRequestNotificationResult
} from "@shared/types/SocialConnectionRequestTypes";
import SocialInvite from "@shared/models/SocialInvite";
import AdminSlackService from "@admin/services/AdminSlackService";
import {getConfig, getHostname} from "@api/config/configService";
import * as Sentry from "@sentry/node";
import AdminSendgridService from "@admin/services/AdminSendgridService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminSocialActivityService from "@admin/services/AdminSocialActivityService";
import {getAuthUser, getAuthUserId} from "@api/util/RequestUtil";
import AdminSocialInviteService from "@admin/services/AdminSocialInviteService";
import {generateReferralLink} from '@shared/util/SocialInviteUtil';
import {PageRoute} from "@shared/PageRoutes";
import {unseenActivityCount} from "@shared/util/SocialUtil";


const Config = getConfig();

const app = express();
app.use(cors({origin: true}));

app.post("/send-invite", async (req: functions.https.Request | any, resp: functions.Response) => {
    const requestUser = await getAuthUser(req);
    if (!requestUser || !requestUser.email) {
        console.log("No auth user was found on the request");
        resp.sendStatus(401);
        return
    }

    const payload: SocialInviteRequest | undefined | null = req.body;
    console.log("socialEndpoints.send-invite", payload);

    if (!payload) {
        console.log("No payload was included");
        resp.sendStatus(500);
        return
    }

    const {toContact, message} = payload;

    if (!toContact) {
        console.error("socialEndpoints.send-invite: Email to send to was not provided in payload");
        const errorResponse: InvitationResponse = {success: false, error: "No 'to' email provided", toEmail: ""};
        resp.send(errorResponse);
        return;
    }

    const member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(requestUser.email);

    const response: InvitationResponse = {
        success: true,
        toEmail: toContact.email,
        fromEmail: requestUser.email,
        message: message
    };

    const domain = Config.web.domain;
    const protocol = Config.web.protocol;

    const socialInvite = new SocialInvite();
    if (member) {
        socialInvite.senderMemberId = member.id;
    }
    socialInvite.recipientEmail = toContact.email;
    await AdminSocialInviteService.getSharedInstance().save(socialInvite);
    console.log(socialInvite.id);

    const referralLink: string =
        generateReferralLink({
            member: member,
            utm_source: 'cactus.app',
            utm_medium: 'invite-contact',
            domain: `${protocol}://${domain}`,
            social_invite_id: (socialInvite ? socialInvite.id : undefined)
        });

    try {
        const sentSuccess = await AdminSendgridService.getSharedInstance().sendInvitation({
            toEmail: toContact.email,
            fromEmail: requestUser.email,
            fromName: member ? member.getFullName() : undefined,
            message: message,
            link: referralLink
        });

        if (sentSuccess) {
            // update the SocialInvite record with the sentAt date
            socialInvite.sentAt = new Date();
            await AdminSocialInviteService.getSharedInstance().save(socialInvite);
        } else {
            console.error('Unable to send invite for SocialConnectionRequest ' + socialInvite.id + 'via email.');
        }

        resp.send(response);
    } catch (error) {
        Sentry.captureException(error);
        console.error(error);

        resp.status(500).send({
            toEmail: toContact.email,
            sendSuccess: false,
            error: error,
        });
    }

    return;
});


app.post("/notify-friend-request", async (req: functions.https.Request | any, resp: functions.Response) => {
    const requestUser = await getAuthUser(req);
    if (!requestUser || !requestUser.email) {
        console.log("No auth user was found on the request");
        resp.sendStatus(401);
        return
    }

    const payload: SocialConnectionRequestNotification | undefined | null = req.body;
    console.log("socialEndpoints.notify-friend-request", payload);

    if (!payload) {
        console.log("No payload was included");
        resp.sendStatus(500);
        return
    }

    const {toEmail} = payload;

    if (!toEmail) {
        console.error("socialEndpoints.notify-friend-request: Email to send to was not provided in payload");
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
        console.error(error);
    }

    try {
        await AdminSendgridService.getSharedInstance().sendFriendRequest({
            toEmail: toEmail,
            fromEmail: requestUser.email,
            fromName: member ? member.getFullName() : undefined,
            link: `${getHostname()}${PageRoute.SOCIAL}`
        });

        resp.send(response);
    } catch (error) {
        Sentry.captureException(error);
        console.error(error);

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
    console.log(`Got the auth user after ${authDate.getTime() - startDate.getTime()}`);
    if (!requestUserId) {
        console.log("No auth user was found on the request");
        resp.sendStatus(401);
        return
    }
    const memberStart = new Date().getTime();
    const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(requestUserId);
    const memberEnd = new Date().getTime();
    console.log(`Get member duration ${memberEnd - memberStart}ms`);
    const memberId = member?.id;
    if (!member || !memberId) {
        console.error("No member or memberId found for userId", requestUserId);
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
    console.log(`activity feed summary endpoint processed in ${endDate.getTime() - startDate.getTime()}ms`);

    resp.status(200).send(response);
    return;
});

app.get("/activity-feed", async (req: functions.https.Request | any, resp: functions.Response) => {
    const requestUserId = await getAuthUserId(req);
    if (!requestUserId) {
        console.log("No auth user was found on the request");
        resp.sendStatus(401);
        return
    }

    const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(requestUserId);
    const memberId = member?.id;
    if (!member || !memberId) {
        console.warn("No member was found for the request user id", requestUserId);
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
        console.error(error);

        const errorResponse: SocialActivityFeedResponse = {
            success: false,
            error: error,
        };

        resp.status(500).send(errorResponse);
    }

    return;
});


export default app;