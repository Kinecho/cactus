import CactusMember from "@shared/models/CactusMember";
import SentPrompt from "@shared/models/SentPrompt";
import {PageLoader} from "@web/datasource/models/PageLoader";
import SentPromptService from "@web/services/SentPromptService";
import {PageResult} from "@web/services/FirestoreService";
import JournalEntry from "@web/datasource/models/JournalEntry";


interface JournalFeedDataSourceDelegate {
    didLoad?: (hasData: boolean) => void
    updateAll?: (journalEntries: JournalEntry[]) => void
    onAdded?: (journalEntry: JournalEntry, newIndex: number) => void
    onRemoved?: (journalEntry: JournalEntry, removedIndex: number) => void
    onUpdated?: (journalEntry: JournalEntry, index: number) => void
}

class JournalFeedDataSource {
    member: CactusMember;

    delegate?: JournalFeedDataSourceDelegate;

    memberId: string;
    startDate: Date;
    hasLoaded: boolean = false;
    pages: PageLoader<SentPrompt>[] = [];

    sentPrompts: SentPrompt[] = [];
    orderedPromptIds: string[] = [];
    journalEntriesByPromptId: { [promptId: string]: JournalEntry } = {};

    constructor(member: CactusMember) {
        this.member = member;
        this.memberId = member.id!;
        this.startDate = new Date();
    }

    start() {
        const futurePage = new PageLoader<SentPrompt>();
        const firstPage = new PageLoader<SentPrompt>();

        this.pages = [futurePage, firstPage];

        futurePage.listener = SentPromptService.sharedInstance.observeFuturePrompts({
            memberId: this.memberId,
            since: this.startDate,
            onData: (page) => {
                this.handlePageResult(page);
            },
        });

        firstPage.listener = SentPromptService.sharedInstance.observePage({
            memberId: this.memberId,
            beforeOrEqualTo: this.startDate,
            onData: (page) => {
                console.log("🌵 ******  Got first page results", page);
                this.handlePageResult(page);
                this.hasLoaded = true;

                this.delegate?.didLoad?.(page.results.length > 0)
            }
        });
    }

    private handlePageResult(page: PageResult<SentPrompt>) {

    }

    deinit() {
        console.log("deinit");

        this.pages.forEach(page => {
            page.deinit()
        })

    }

}

export default JournalFeedDataSource