import {Endpoint, getAuthHeaders, request} from "@web/requestUtils";
import {EmailContact} from "@shared/types/EmailContactTypes";
import {InviteResult, SocialInviteRequest} from "@shared/types/SocialInviteTypes";
import {SocialConnectionRequestNotification} from "@shared/types/SocialConnectionRequestTypes";
import {ActivitySummaryResponse, SocialActivityFeedResponse} from "@shared/types/SocialTypes";
import {getAuth} from "@web/firebase";
import MemberProfileService from '@web/services/MemberProfileService';
import SocialConnectionRequest from "@shared/models/SocialConnectionRequest";
import CactusMember from "@shared/models/CactusMember";
import {AxiosError} from "axios";

export async function sendInvite(contact: EmailContact, message: string): Promise<InviteResult> {
    const currentUser = getAuth().currentUser;

    if (!currentUser) {
        return {
            data: {
                success: false,
            },
            email: contact.email,
            message: "Current user is not authenticated."
        }
    } else {
        console.log(currentUser);
        const requestOptions: SocialInviteRequest = {
            toContact: contact,
            message: message
        };

        try {
            const headers = await getAuthHeaders();
            return await request.post(Endpoint.sendInvite, requestOptions, {headers});
        } catch (e) {
            return {
                data: {
                    success: false,
                },
                email: requestOptions.toContact.email,
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
        console.error('User, member, or SocialConnectionRequest was missing while sending a Friend Request.');
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
            return await request.post(Endpoint.notifyFriendRequest, requestOptions, {headers});
        } catch (e) {
            console.error("Failed to notify friend request. The API call threw an error", e);
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
        console.error('No user found for getSocialActivity request');
        return {
            success: false,
            message: "You must be logged in to make this request."
        };
    } else {


        try {
            const headers = await getAuthHeaders();
            const apiResponse = await request.get(Endpoint.activityFeed, {headers});
            return apiResponse.data;
        } catch (e) {
            console.error("Failed get activity feed. The API call threw an error", e);
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
        const response = await request.get(Endpoint.activityFeedSummary, {headers: await getAuthHeaders()});
        return response.data;
    } catch (error) {
        if (error.isAxiosError) {
            console.error("Failed to fetch activity summary", (error as AxiosError).response?.data)
        } else {
            console.log("Failed to fetch activity summary", error);
        }
        return;
    }
}