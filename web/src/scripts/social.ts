import {Endpoint, getAuthHeaders, request} from "@web/requestUtils";
import {EmailContact} from "@shared/types/EmailContactTypes";
import {InviteResult, SocialInviteRequest} from "@shared/types/SocialInviteTypes";
import {SocialConnectionRequestNotification} from "@shared/types/SocialConnectionRequestTypes";
import {
    SocialActivityFeedEvent,
    SocialActivityFeedRequest,
    SocialActivityFeedResponse
} from "@shared/types/SocialTypes";
import {getAuth} from "@web/firebase";
import MemberProfileService from '@web/services/MemberProfileService';
import {SocialConnectionRequest} from "@shared/models/SocialConnectionRequest";
import CactusMember from "@shared/models/CactusMember";
import StorageService, {LocalStorageKey} from "@web/services/StorageService";

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
        const requestOptions: SocialActivityFeedRequest = {
            memberId: member.id
        };

        try {
            const headers = await getAuthHeaders();
            const apiResponse = await request.post(Endpoint.activityFeed, requestOptions, {headers});
            const feed: SocialActivityFeedResponse = apiResponse.data;
            return feed;
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

export function getActivityBadgeCount(options: { member: CactusMember, events: SocialActivityFeedEvent[], cacheResult?: boolean }): number {
    const {member, events, cacheResult = true} = options;

    const lastSeenOccurredAt = member.activityStatus?.lastSeenOccurredAt;

    let count = 0;
    if (!lastSeenOccurredAt) {
        // never looked at activity
        count = events?.length || 0;
    } else if (lastSeenOccurredAt && events) {
        const lastSeenMs = lastSeenOccurredAt.getTime();
        // count how many new events there are

        // if the events are already sorted, we can just look for the index of the
        // first entry where the date is before the last seen date
        // this prevents us from looping through an potentially very long list for no reason.
        //
        // Example:
        // const index = events.findIndex(event => {
        //     return event.occurredAt && event.occurredAt.getTime() <= lastSeenMs
        // });
        // console.log(`Found last activity index of ${index}`);
        // this.activityBadgeCount = index;

        count = events.filter((event: SocialActivityFeedEvent) => {
            return event.occurredAt && event.occurredAt.getTime() > lastSeenMs
        }).length;
    }

    if (cacheResult) {
        StorageService.saveNumber(LocalStorageKey.activityBadgeCount, count);
    }

    return count;
}