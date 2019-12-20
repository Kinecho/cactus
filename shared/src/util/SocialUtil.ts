import CactusMember from "@shared/models/CactusMember";
import {SocialActivityFeedEvent} from "@shared/types/SocialTypes";

export function unseenActivityCount(options: { member: CactusMember, events: SocialActivityFeedEvent[] }): number {
    try {
        const {member, events} = options;
        const lastSeenOccurredAt = member.activityStatus?.lastSeenOccurredAt;

        let count = 0;

        if (!lastSeenOccurredAt) {
            count = events?.length || 0;
        } else if (lastSeenOccurredAt && lastSeenOccurredAt?.getTime && events) {
            const lastSeenMs = lastSeenOccurredAt.getTime();

            //this assumes the events are ordered
            count = events.findIndex(event => {
                return event.occurredAt && event.occurredAt.getTime() <= lastSeenMs
            });
        }

        return count;
    } catch (error) {
        console.error("Failed to process unseen activity count", error);
        return 0;
    }

}