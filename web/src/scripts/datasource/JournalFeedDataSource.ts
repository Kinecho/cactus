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
}

interface SetupJournalEntryResult {
    created: boolean,
    entry?: JournalEntry,

}

class JournalFeedDataSource implements JournalEntryDelegate{
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


    journalEntries: JournalEntry[] = [];

    constructor(member: CactusMember) {
        this.member = member;
        this.memberId = member.id!;
        this.startDate = new Date();
    }

    start() {
        const futurePage = new PageLoader<SentPrompt>();
        const firstPage = new PageLoader<SentPrompt>();

        this.pages = [
            futurePage,
            firstPage
        ];

        futurePage.listener = SentPromptService.sharedInstance.observeFuturePrompts({
            memberId: this.memberId,
            since: this.startDate,
            onData: (page) => {
                futurePage.result = page;
                this.handlePageResult(page);
            },
        });

        firstPage.listener = SentPromptService.sharedInstance.observePage({
            memberId: this.memberId,
            beforeOrEqualTo: this.startDate,
            limit: this.pageSize,
            onData: (page) => {
                console.log("🌵 🥇Got first page results", page);
                firstPage.result = page;
                this.delegate?.didLoad?.(page.results.length > 0);

                this.handlePageResult(page);
                this.hasLoaded = true;


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

        const journalEntries:JournalEntry[] = [];
        updatedSentPrompts.forEach(sentPrompt => {
            if (sentPrompt.promptId) {
                updatedPromptIds.push(sentPrompt.promptId);

                const entry = this.journalEntriesByPromptId[sentPrompt.promptId];
                if (entry){
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

    deinit() {
        console.log("deinit journalEntryDataSource");

        this.pages.forEach(page => {
            page.deinit()
        });

        this.journalEntries.forEach(entry => {
            entry.stop()
        });

    }

    entryUpdated(entry: JournalEntry) {
        const index = this.getIndexForEntry(entry);
        console.log("entry updated for index", index);
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