import FlamelinkService, {EntryObserverOptions} from "@web/services/FlamelinkService";
import PromptContent from "@shared/models/PromptContent";
import {ListenerUnsubscriber} from "@web/services/FirestoreService";

export default class PromptContentService {
    public static sharedInstance = new PromptContentService();
    flamelinkService = FlamelinkService.sharedInstance;

    getByEntryId(entryId: string): Promise<PromptContent | undefined> {
        return this.flamelinkService.getById(entryId, PromptContent)
    }

    observeByEntryId(entryId: string, options: EntryObserverOptions<PromptContent>): ListenerUnsubscriber {
        return this.flamelinkService.observeByEntryId(entryId, PromptContent, options)
    }

    observeByPromptId(promptId: string, options: EntryObserverOptions<PromptContent>): ListenerUnsubscriber {
        return this.flamelinkService.observeByField({name: PromptContent.Fields.promptId, value: promptId, Type: PromptContent}, options)
    }
}



