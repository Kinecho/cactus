import CactusMember from "@shared/models/CactusMember";
import {SocialActivityFeedEvent} from "@shared/types/SocialTypes";
import Logger from "@shared/Logger";

const logger = new Logger("SocialUtil.ts");

export function unseenActivityCount(options: { member: CactusMember, events: SocialActivityFeedEvent[] }): number {
    try {
        const {member, events} = options;
        let lastSeenOccurredAt = member.activityStatus?.lastSeenOccurredAt as Date | undefined | number;

        // TODO: this is a "hack" to deal with some malformed data that we
        // haven't figured out where it's coming from yet.
        // This will at least let us use the dates if they're stored as numbers
        if (lastSeenOccurredAt && typeof lastSeenOccurredAt === "number") {
            lastSeenOccurredAt = new Date(lastSeenOccurredAt);
        }

        let count = 0;

        if (!lastSeenOccurredAt) {
            count = events?.length || 0;
        } else if (lastSeenOccurredAt && lastSeenOccurredAt instanceof Date && lastSeenOccurredAt?.getTime && events) {
            const lastSeenMs = lastSeenOccurredAt.getTime();

            //this assumes the events are ordered
            count = events.findIndex(event => {
                return event.occurredAt && event.occurredAt.getTime() <= lastSeenMs
            });
        }

        return count;
    } catch (error) {
        logger.error("Failed to process unseen activity count", error);
        return 0;
    }

}