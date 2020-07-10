import { Endpoint, getAuthHeaders, request } from "@web/requestUtils";
import { EmailContact } from "@shared/types/EmailContactTypes";
import { InvitationResponse, SocialInviteRequest } from "@shared/types/SocialInviteTypes";
import { SocialConnectionRequestNotification } from "@shared/types/SocialConnectionRequestTypes";
import { ActivitySummaryResponse, SocialActivityFeedResponse } from "@shared/types/SocialTypes";
import { getAuth } from "@web/firebase";
import MemberProfileService from '@web/services/MemberProfileService';
import SocialConnectionRequest from "@shared/models/SocialConnectionRequest";
import CactusMember from "@shared/models/CactusMember";
import { AxiosError } from "axios";
import Logger from "@shared/Logger";
import { getAppType } from "@web/DeviceUtil";

const logger = new Logger("social.ts");

export async function sendInvite(contact: EmailContact, message: string): Promise<InvitationResponse> {
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
        logger.info("User is not logged in, can not send invite email.")
        return {
            success: false,
            toEmails: [contact.email],
            error: "Current user is not logged in.",
            message: "You must be logged in to send an invite."
        }
    } else {
        logger.log("current user", currentUser);
        const requestOptions: SocialInviteRequest = {
            app: getAppType(),
            toContact: contact,
            message: message
        };

        try {
            const headers = await getAuthHeaders();
            const apiResponse = await request.post(Endpoint.sendInvite, requestOptions, { headers });
            return apiResponse.data;
        } catch (e) {
            logger.error("API Call to social invite failed", e.response?.data ? e.response.data : e);
            return {
                success: false,
                toEmails: [requestOptions.toContact.email],
                message: "Failed to send invitation",
                error: e
            }
        }
    }
}

export async function notifyFriendRequest(socialConnectionRequest: SocialConnectionRequest): Promise<any> {
    const currentUser = getAuth().currentUser;
    const toMember = await MemberProfileService.sharedInstance.getByMemberId(socialConnectionRequest.friendMemberId);

    if (!currentUser || !toMember?.email || !socialConnectionRequest.id) {
        logger.error('User, member, or SocialConnectionRequest was missing while sending a Friend Request.');
        return {
            success: false,
            socialConnectionRequest: socialConnectionRequest.id,
            message: "Something was missing. Refresh the website and try again."
        }
    } else {
        const requestOptions: SocialConnectionRequestNotification = {
            toEmail: toMember.email,
            socialConnectionRequestId: socialConnectionRequest.id
        };

        try {
            const headers = await getAuthHeaders();
            return await request.post(Endpoint.notifyFriendRequest, requestOptions, { headers });
        } catch (e) {
            logger.error("Failed to notify friend request. The API call threw an error", e);
            return {
                success: false,
                socialConnectionRequest: socialConnectionRequest.id,
                error: e
            }
        }
    }
}

export async function getSocialActivity(member: CactusMember): Promise<SocialActivityFeedResponse> {
    const currentUser = getAuth().currentUser;

    if (!currentUser || !member?.id) {
        logger.error('No user found for getSocialActivity request');
        return {
            success: false,
            message: "You must be logged in to make this request."
        };
    } else {


        try {
            const headers = await getAuthHeaders();
            const apiResponse = await request.get(Endpoint.activityFeed, { headers });
            return apiResponse.data;
        } catch (e) {
            logger.error("Failed get activity feed. The API call threw an error", e);
            return {
                success: false,
                message: "Unexpected error",
                error: e
            };
        }
    }
}

export async function fetchActivityFeedSummary(): Promise<ActivitySummaryResponse | undefined> {
    try {
        const response = await request.get(Endpoint.activityFeedSummary, { headers: await getAuthHeaders() });
        return response.data;
    } catch (error) {
        if (error.isAxiosError) {
            logger.error("Failed to fetch activity summary", (error as AxiosError).response?.data)
        } else {
            logger.log("Failed to fetch activity summary", error);
        }
        return;
    }
}