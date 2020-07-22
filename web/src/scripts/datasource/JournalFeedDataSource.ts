import CactusMember from "@shared/models/CactusMember";
import SentPrompt from "@shared/models/SentPrompt";
import { PageLoader } from "@web/datasource/models/PageLoader";
import SentPromptService from "@web/services/SentPromptService";
import { PageResult } from "@web/services/FirestoreService";
import JournalEntry, { JournalEntryDelegate } from "@web/datasource/models/JournalEntry";
import Logger from "@shared/Logger";
import TodayPromptDataSource, { TodayPromptDataSourceDelegate } from "@web/datasource/TodayPromptDataSource";

const logger = new Logger("JournalFeedDataSource");

export interface JournalFeedDataSourceDelegate {
    didLoad?: (hasData: boolean) => void
    updateAll?: (journalEntries: JournalEntry[]) => void
    onAdded?: (journalEntry: JournalEntry, newIndex: number) => void
    onRemoved?: (journalEntry: JournalEntry, removedIndex: number) => void
    onUpdated?: (journalEntry: JournalEntry, index: number) => void
    pageLoaded?: (hasMore: boolean) => void
    todayEntryUpdated?: (entry?: JournalEntry|null) => void;
}

export interface SetupJournalEntryResult {
    created: boolean,
    entry?: JournalEntry,

}

class JournalFeedDataSource implements JournalEntryDelegate, TodayPromptDataSourceDelegate {
    static current: JournalFeedDataSource | null = null;
    running = false;
    member: CactusMember;
    pageSize: number = 10;
    delegate?: JournalFeedDataSourceDelegate;

    memberId: string;
    startDate: Date;
    hasLoaded: boolean = false;
    pages: PageLoader<SentPrompt>[] = [];

    sentPrompts: SentPrompt[] = [];

    journalEntriesByPromptId: { [promptId: string]: JournalEntry } = {};
    todayDataSource: TodayPromptDataSource;
    todayEntry: JournalEntry | null = null;
    loadingPage: boolean = false;

    journalEntries: JournalEntry[] = [];

    onlyCompleted: boolean = false;

    protected constructor(member: CactusMember, options?: { onlyCompleted?: boolean }) {
        this.member = member;
        this.memberId = member.id!;
        this.startDate = new Date();
        const { onlyCompleted = false } = options || {};
        this.onlyCompleted = onlyCompleted;
        this.todayDataSource = new TodayPromptDataSource({ member, delegate: this });
    }

    static setup(member: CactusMember, options?: { onlyCompleted?: boolean, delegate?: JournalFeedDataSourceDelegate }): JournalFeedDataSource {
        const { delegate, onlyCompleted } = options ?? {};
        logger.info("Setting up data source", { memberId: member.id, onlyCompleted, delegate: !!delegate });
        let source: JournalFeedDataSource;
        const current = JournalFeedDataSource.current;
        if (current && (current.member?.id === member.id || current.memberId === member.id) && current.onlyCompleted === onlyCompleted) {
            logger.debug("using current data source = true")
            source = current;
        } else {
            logger.debug("using current data source = false")
            source = new JournalFeedDataSource(member, options);
        }

        if (delegate) {
            source.delegate = delegate
        }
        JournalFeedDataSource.current = source;
        return source;
    }


    async start() {
        logger.debug("Starting data source. Has has delegate = ", !!this.delegate);
        if (this.running && this.hasLoaded) {
            logger.info("Data source is running, returning current entries");
            this.delegate?.didLoad?.(this.journalEntries.length > 0);
            this.delegate?.todayEntryUpdated?.(this.todayEntry);
            return;
        }
        this.running = true;
        await this.todayDataSource.start()
        const futurePage = new PageLoader<SentPrompt>();
        const firstPage = new PageLoader<SentPrompt>();
        this.loadingPage = true;
        this.pages = [
            futurePage,
            firstPage
        ];

        futurePage.listener = SentPromptService.sharedInstance.observeFuturePrompts({
            memberId: this.memberId,
            since: this.startDate,
            onlyCompleted: this.onlyCompleted,
            onData: (page) => {
                futurePage.result = page;
                this.handlePageResult(page);
            },
        });

        firstPage.listener = SentPromptService.sharedInstance.observePage({
            memberId: this.memberId,
            beforeOrEqualTo: this.startDate,
            limit: this.pageSize,
            onlyCompleted: this.onlyCompleted,
            onData: (page) => {
                logger.log("🌵 🥇Got first page results", page);
                firstPage.result = page;

                this.handlePageResult(page);
                this.hasLoaded = true;
                this.loadingPage = false;
                logger.info(this.delegate ? "sending results to delegate" : "No delegate present");
                this.delegate?.didLoad?.(page.results.length > 0);
            }
        });
    }

    private handlePageResult(page: PageResult<SentPrompt>) {
        this.sentPrompts = page.results;
        page.results.forEach(sentPrompt => {
            const promptId = sentPrompt.promptId;
            if (!promptId) {
                return;
            }
            this.setupJournalEntry(sentPrompt);
        });

        this.configureData()
    }

    configureData() {
        const orderedSentPrompts: SentPrompt[] = [];
        this.pages.forEach(page => {
            orderedSentPrompts.push(...(page.result?.results || []))
        });

        const journalEntries: JournalEntry[] = [];
        let hasTodaySentPrompt = false;
        orderedSentPrompts.forEach(sentPrompt => {
            const promptId = sentPrompt.promptId;
            if (!promptId) {
                return;
            }
            if (promptId === this.todayEntry?.promptId) {
                hasTodaySentPrompt = true;
            }
            const entry = this.journalEntriesByPromptId[promptId];
            if (entry) {
                journalEntries.push(entry);
            }

        });

        const todayFirstSentAt = this.todayEntry?.sentPrompt?.firstSentAt ?? this.todayEntry?.sentPrompt?.createdAt;
        const todaySentPromptIndex = journalEntries.findIndex(entry => {
            const sendDate = entry.sentPrompt?.firstSentAt ?? entry.sentPrompt?.createdAt
            if (!sendDate || !todayFirstSentAt) {
                return false;
            }
            return sendDate < todayFirstSentAt
        })

        if (this.todayEntry && !hasTodaySentPrompt) {
            journalEntries.splice(Math.max(todaySentPromptIndex, 0), 0, this.todayEntry);
        }

        this.journalEntries = journalEntries;
        this.delegate?.updateAll?.(this.journalEntries);

    }

    /**
     *
     * @param {SentPrompt} sentPrompt
     * @return {boolean} if a new entry was added
     */
    setupJournalEntry(sentPrompt: SentPrompt): SetupJournalEntryResult {
        const promptId = sentPrompt.promptId;
        if (!promptId) {
            return {
                created: false
            };
        }
        let entry = this.journalEntriesByPromptId[promptId];
        if (entry) {
            return { created: false, entry }
        }

        entry = new JournalEntry(promptId, sentPrompt, this.member);
        entry.delegate = this;
        entry.start();
        this.journalEntriesByPromptId[promptId] = entry;

        return {
            created: true,
            entry,
        }
    }

    /**
     *
     * @return {boolean} True if the next page will be loaded, false if not.
     */
    loadNextPage(): boolean {
        if (this.loadingPage) {
            return false;
        }
        if (!this.hasLoaded) {
            return false;
        }

        if (this.pages.length === 0) {
            return false;
        }
        const lastPage = this.pages[this.pages.length - 1];

        if (!lastPage.finishedLoading) {
            return false;
        }

        if (lastPage.result?.mightHaveMore !== true) {
            return false;
        }

        const nextPage = new PageLoader<SentPrompt>();
        this.pages.push(nextPage);
        nextPage.listener = SentPromptService.sharedInstance.observePage({
            memberId: this.memberId,
            limit: this.pageSize,
            lastResult: lastPage.result,
            onlyCompleted: this.onlyCompleted,
            onData: (page) => {
                nextPage.result = page;

                this.handlePageResult(page);
                this.loadingPage = false;
                this.delegate?.pageLoaded?.(page.mightHaveMore);
            }
        });

        return true;
    }

    stop() {
        logger.info("Stopping journal feed data source");
        this.pages.forEach(page => {
            page.stop()
        });

        this.journalEntries.forEach(entry => {
            entry.stop()
        });

        this.journalEntries = [];
        this.pages = []
    }

    entryUpdated(entry: JournalEntry) {
        const index = this.getIndexForEntry(entry);
        this.delegate?.onUpdated?.(entry, index);
    }

    getIndexForEntry(entry: JournalEntry): number {
        const promptId = entry.promptId;
        if (!promptId) {
            return -1;
        }
        return this.journalEntries.findIndex(e => e.promptId === promptId);
    }

    todayEntryUpdated(entry?: JournalEntry | null) {
        logger.info("Today entry updated", entry);
        this.todayEntry = entry ?? null;
        if (entry?.promptId) {
            this.journalEntriesByPromptId[entry.promptId] = entry;
        }
        this.configureData();
        this.delegate?.todayEntryUpdated?.(entry);
    }

}

export default JournalFeedDataSource