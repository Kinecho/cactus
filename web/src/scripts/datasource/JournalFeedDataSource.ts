import CactusMember from "@shared/models/CactusMember";
import SentPrompt from "@shared/models/SentPrompt";
import {PageLoader} from "@web/datasource/models/PageLoader";
import SentPromptService from "@web/services/SentPromptService";
import {PageResult} from "@web/services/FirestoreService";
import JournalEntry, {JournalEntryDelegate} from "@web/datasource/models/JournalEntry";


interface JournalFeedDataSourceDelegate {
    didLoad?: (hasData: boolean) => void
    updateAll?: (journalEntries: JournalEntry[]) => void
    onAdded?: (journalEntry: JournalEntry, newIndex: number) => void
    onRemoved?: (journalEntry: JournalEntry, removedIndex: number) => void
    onUpdated?: (journalEntry: JournalEntry, index: number) => void
    pageLoaded?: (hasMore: boolean) => void
}

interface SetupJournalEntryResult {
    created: boolean,
    entry?: JournalEntry,

}

class JournalFeedDataSource implements JournalEntryDelegate {
    member: CactusMember;
    pageSize: number = 10;
    delegate?: JournalFeedDataSourceDelegate;

    memberId: string;
    startDate: Date;
    hasLoaded: boolean = false;
    pages: PageLoader<SentPrompt>[] = [];

    sentPrompts: SentPrompt[] = [];
    orderedPromptIds: string[] = [];
    journalEntriesByPromptId: { [promptId: string]: JournalEntry } = {};

    loadingPage: boolean = false;

    journalEntries: JournalEntry[] = [];

    onlyCompleted: boolean = false;

    constructor(member: CactusMember, options?: { onlyCompleted?: boolean }) {
        this.member = member;
        this.memberId = member.id!;
        this.startDate = new Date();
        const {onlyCompleted = false} = options || {};
        this.onlyCompleted = onlyCompleted;
    }

    start() {
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
                console.log("🌵 🥇Got first page results", page);
                firstPage.result = page;

                this.handlePageResult(page);
                this.hasLoaded = true;
                this.loadingPage = false;
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
        const currentPromptIds = this.orderedPromptIds;
        const currentSentPrompts = this.sentPrompts;

        const updatedSentPrompts: SentPrompt[] = [];
        const updatedPromptIds: string[] = [];
        this.pages.forEach(page => {
            updatedSentPrompts.push(...(page.result?.results || []))
        });

        const journalEntries: JournalEntry[] = [];
        updatedSentPrompts.forEach(sentPrompt => {
            if (sentPrompt.promptId) {
                updatedPromptIds.push(sentPrompt.promptId);

                const entry = this.journalEntriesByPromptId[sentPrompt.promptId];
                if (entry) {
                    journalEntries.push(entry);
                }
            }
        });

        this.sentPrompts = updatedSentPrompts;
        this.orderedPromptIds = updatedPromptIds;
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
            return {created: false, entry}
        }

        entry = new JournalEntry(sentPrompt);
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
            console.log("[JournalFeedDataSource] Page is loading, not doing anything");
            return false;
        }
        if (!this.hasLoaded) {
            console.log("[JournalFeedDataSource] Not set up, can't load next page");
            return false;
        }

        if (this.pages.length === 0) {
            console.log("[JournalFeedDataSource] There are no pages. Can't load next page");
            return false;
        }
        const lastPage = this.pages[this.pages.length - 1];

        if (!lastPage.finishedLoading) {
            console.log("[JournalFeedDataSource] Last page has not finished loading.");
            return false;
        }

        if (lastPage.result?.mightHaveMore !== true) {
            console.log("[JournalFeedDataSource] There is no more expected data. Not loading");
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
                console.log("🌵 Got Next page results", page);
                nextPage.result = page;

                this.handlePageResult(page);
                this.loadingPage = false;
                this.delegate?.pageLoaded?.(page.mightHaveMore);
            }
        });

        return true;
    }

    stop() {
        console.log("[JournalEntryDataSource] stop() called");
        this.pages.forEach(page => {
            page.stop()
        });

        this.journalEntries.forEach(entry => {
            entry.stop()
        });

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
        return this.orderedPromptIds.indexOf(promptId);
    }

}

export default JournalFeedDataSource