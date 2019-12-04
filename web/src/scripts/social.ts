import {Endpoint, getAuthHeaders, request} from "@web/requestUtils";
import {EmailContact} from "@shared/types/EmailContactTypes";
import {InviteResult, SocialInviteRequest} from "@shared/types/SocialInviteTypes";
import {SocialConnectionRequestNotification,
        SocialConnectionRequestNotificationResult} from "@shared/types/SocialConnectionRequestTypes";
import {getAuth} from "@web/firebase";
import MemberProfile from "@shared/models/MemberProfile";
import MemberProfileService from '@web/services/MemberProfileService';
import {SocialConnectionRequest} from "@shared/models/SocialConnection";

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
        return {
            success: false,
            socialConnectionRequest: socialConnectionRequest.id,
            message: "Something was missing. Refresh the website and try again."
        }
        console.error('User, member, or SocialConnectionRequest was missing while sending a Friend Request.')
        
    } else {
        const requestOptions: SocialConnectionRequestNotification = {
            toEmail: toMember.email,
            socialConnectionRequestId: socialConnectionRequest.id
        };

        try {
            const headers = await getAuthHeaders();
            return await request.post(Endpoint.notifyFriendRequest, requestOptions, {headers});
        } catch (e) {
            console.error(e);
            return {
                success: false,
                socialConnectionRequest: socialConnectionRequest.id,
                error: e
            }
        }
    }
}