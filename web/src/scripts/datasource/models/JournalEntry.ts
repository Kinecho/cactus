import ReflectionResponse from "@shared/models/ReflectionResponse";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import PromptContent from "@shared/models/PromptContent";
import SentPrompt from "@shared/models/SentPrompt";
import { ListenerUnsubscriber } from "@web/services/FirestoreService";
import ReflectionResponseService from "@web/services/ReflectionResponseService";
import ReflectionPromptService from "@web/services/ReflectionPromptService";
import PromptContentService from "@web/services/PromptContentService";
import Logger from "@shared/Logger";
import CactusMember from "@shared/models/CactusMember";

const logger = new Logger("JournalEntry.ts");

export interface JournalEntryDelegate {
    entryUpdated: (entry: JournalEntry) => void
}

class JournalEntry {
    promptId: string;
    member?: CactusMember | null = null;

    delegate?: JournalEntryDelegate = undefined;
    sentPrompt?: SentPrompt;

    responses?: ReflectionResponse[] = undefined;
    responsesLoaded: boolean = false;
    responsesUnsubscriber?: ListenerUnsubscriber;

    prompt?: ReflectionPrompt = undefined;
    promptLoaded: boolean = false;
    promptUnsubscriber?: ListenerUnsubscriber = undefined;

    promptContent?: PromptContent = undefined;
    promptContentLoaded: boolean = false;
    promptContentUnsubscriber?: ListenerUnsubscriber;

    constructor(promptId: string, sentPrompt?: SentPrompt, member?: CactusMember | null) {
        this.promptId = promptId;
        this.member = member;
        if (sentPrompt) {
            this.sentPrompt = sentPrompt;
        }
    }

    get allLoaded(): boolean {
        return this.responsesLoaded && this.promptLoaded && this.promptContentLoaded;
    }

    start() {
        const promptId = this.promptId;
        this.responsesUnsubscriber = ReflectionResponseService.sharedInstance.observeForPromptId(promptId, {
            member: this.member,
            onData: (responses) => {
                this.responses = responses;
                this.responsesLoaded = true;
                this.delegate?.entryUpdated(this);
            }
        });

        this.promptUnsubscriber = ReflectionPromptService.sharedInstance.observeById(promptId, {
            onData: (prompt) => {
                this.prompt = prompt;
                this.promptLoaded = true;
                this.delegate?.entryUpdated(this);
            }
        });

        this.promptContentUnsubscriber = PromptContentService.sharedInstance.observeByPromptId(promptId, {
            onData: (promptContent) => {
                this.promptContent = promptContent;
                this.promptContentLoaded = true;
                this.delegate?.entryUpdated(this);
            }
        })
    }

    stop() {
        this.promptUnsubscriber?.();
        this.promptUnsubscriber = undefined;

        this.promptContentUnsubscriber?.();
        this.promptContentUnsubscriber = undefined;

        this.responsesUnsubscriber?.();
        this.responsesUnsubscriber = undefined;

    }

}


export default JournalEntry