import Logger from "@shared/Logger"
import JournalEntry from "@web/datasource/models/JournalEntry";
import CactusMember from "@shared/models/CactusMember";
import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import PromptContentService from "@web/services/PromptContentService";
import SentPromptService from "@web/services/SentPromptService";
import SentPrompt from "@shared/models/SentPrompt";
import { ListenerUnsubscriber } from "@web/services/FirestoreService";

const logger = new Logger("TodayPromptDataSource");


export interface TodayPromptDataSourceDelegate {
    dateChanged?: () => void;
    todayEntryUpdated: (entry?: JournalEntry | null) => void;
}

export default class TodayPromptDataSource {
    member: CactusMember;
    lastChecked = new Date();
    checkDateInterval?: number;
    checkDateDelayMs: number;
    delegate?: TodayPromptDataSourceDelegate;
    loading = false;
    todayEntry: JournalEntry | null = null;
    hasLoaded = false;
    sentPromptUnsubscriber: ListenerUnsubscriber | null = null;

    constructor(params: { member: CactusMember, checkDateDelayMs?: number, delegate?: TodayPromptDataSourceDelegate }) {
        const {
            checkDateDelayMs = 10000,
            member,
            delegate,
        } = params
        this.member = member;
        this.checkDateDelayMs = checkDateDelayMs;
        this.delegate = delegate;
    }

    stop() {
        window.clearInterval(this.checkDateInterval)
    }

    async checkDateChange() {
        const current = new Date()
        const changed = this.didDayChange(current)
        this.lastChecked = current;
        if (changed) {
            logger.info("Date changed. Current Date = ", current.toLocaleDateString());
            this.delegate?.dateChanged?.();
            this.hasLoaded = false;
            await this.start()
        }
    }

    didDayChange(current: Date): boolean {
        const dateNow = current.getDate();
        return this.lastChecked.getDate() !== dateNow
    }

    async start() {
        this.loading = true;
        const memberId = this.member?.id;
        if (!memberId) {
            logger.warn("No cactus member ID was found");
            this.loading = false;
            this.hasLoaded = true;
            this.sentPromptUnsubscriber?.();
            this.delegate?.todayEntryUpdated(this.todayEntry);
            return;
        }

        window.clearInterval(this.checkDateInterval);
        this.checkDateInterval = window.setInterval(async () => {
            await this.checkDateChange()
        }, 30000)

        const tier = this.member?.tier ?? SubscriptionTier.PLUS;
        const todayPromptContent = await PromptContentService.sharedInstance.getPromptContentForDate({
            systemDate: new Date(),
            subscriptionTier: tier
        });

        const promptId = todayPromptContent?.promptId;
        if (!promptId) {
            logger.warn("No today prompt content found for date and tiers");
            this.sentPromptUnsubscriber?.();
            this.todayEntry = null;
            this.delegate?.todayEntryUpdated(null);
            this.loading = false;
            this.hasLoaded = true;
            return;
        }

        logger.info("Starting today observer with promptID", promptId);
        this.sentPromptUnsubscriber = SentPromptService.sharedInstance.observeByPromptId(memberId, promptId, {
            onData: async (todaySentPrompt: SentPrompt | undefined) => {
                logger.info("Fetched today sent prompt")
                const todayEntry = new JournalEntry(promptId, todaySentPrompt, this.member);
                this.todayEntry = todayEntry;
                this.hasLoaded = true;
                todayEntry.delegate = {
                    entryUpdated: entry => {
                        if (entry.allLoaded) {
                            this.delegate?.todayEntryUpdated(entry);
                        }
                    }
                };
                todayEntry.start();
                this.delegate?.todayEntryUpdated(todayEntry);
            }
        });
    }
}