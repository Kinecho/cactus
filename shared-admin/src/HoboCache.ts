import PromptContent from "@shared/models/PromptContent";
import Logger from "@shared/Logger"
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import { DateObject, DateTime } from "luxon";
import CactusMember from "@shared/models/CactusMember";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";

const logger = new Logger("HoboCache");


const defaultMaxAge = 10 * 60 * 1000; // 10 minutes

export default class HoboCache {
    static shared = new HoboCache(defaultMaxAge);

    static initialize(maxAge: number = defaultMaxAge) {
        HoboCache.shared = new HoboCache(maxAge);
    }

    maxAge: number;
    promptContentByEntryId: Record<string, PromptContent | null> = {}
    promptContentByScheduledDate: Record<string, PromptContent | null> = {}
    memberById: Record<string, CactusMember | null> = {}

    constructor(maxAge: number) {
        this.maxAge = maxAge;
        setTimeout(() => {
            this.purge()
        }, this.maxAge);
    }

    setPromptContent(entryId: string, promptContent: PromptContent | undefined | null) {
        this.promptContentByEntryId[entryId] = promptContent ?? null;
    }

    hasCachedPromptContent(entryId: string): boolean {
        return this.promptContentByEntryId[entryId] !== undefined;
    }

    getPromptContent(entryId: string): PromptContent | null | undefined {
        return this.promptContentByEntryId[entryId]
    }

    async getMemberById(id?: string | null): Promise<{ member?: CactusMember | null, cached: boolean }> {
        if (!id) {
            return { member: undefined, cached: false };
        }
        let member: CactusMember | undefined | null = this.memberById[id];
        if (member === null) {
            return { member, cached: true };
        }
        member = await AdminCactusMemberService.getSharedInstance().getById(id) ?? null;
        this.memberById[id] = member;
        return { member, cached: false };
    }

    async getPromptContentForIsoDateObject(dateObject: DateObject): Promise<{ promptContent: PromptContent | null | undefined, cached: boolean }> {
        const dateISO = DateTime.fromObject(dateObject).toISODate();
        if (this.promptContentByScheduledDate.hasOwnProperty(dateISO)) {
            return { promptContent: this.promptContentByScheduledDate[dateISO], cached: true };
        }
        logger.info(`No prompt content found in cache for date ${ dateISO }, fetching from server`);
        const promptContent = await AdminPromptContentService.getSharedInstance().getPromptContentForDate({
            dateObject: dateObject,
        });
        logger.info(`setting cache key ${ dateISO } to promptContent.promptId ${ promptContent?.promptId }`);
        this.promptContentByScheduledDate[dateISO] = promptContent ?? null;

        return { promptContent, cached: false };
    }

    async fetchPromptContent(entryId?: string): Promise<{ promptContent: PromptContent | null | undefined, cached: boolean }> {
        if (!entryId) {
            return { promptContent: undefined, cached: false };
        }
        if (this.hasCachedPromptContent(entryId)) {
            return { promptContent: this.getPromptContent(entryId), cached: true }
        }
        const promptContent = await AdminPromptContentService.getSharedInstance().getByEntryId(entryId);
        this.setPromptContent(entryId, promptContent);
        return { promptContent, cached: false };
    }

    purge() {
        logger.info("Resetting HoboCache");
        HoboCache.initialize(this.maxAge)
    }

    static purge() {
        logger.info("Purging the hobo cache")
        HoboCache.initialize(HoboCache.shared.maxAge);
    }
}