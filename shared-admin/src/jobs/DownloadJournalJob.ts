import CactusMember from "@shared/models/CactusMember";
import PromptContent from "@shared/models/PromptContent";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import SentPrompt from "@shared/models/SentPrompt";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";

interface JournalEntry {
    date?: Date;
    sentPrompt: SentPrompt;
    reflectionResponses?: ReflectionResponse[];
    promptContent?: PromptContent;
}

// interface JournalEntryJson {
//     date?: string;
//     sentPrompt: any;
//     reflectionResponses?: any[];
//     promptContent?: any;
// }

export default class DownloadJournalJob {
    member: CactusMember;
    journalEntries: JournalEntry[] = [];
    redactResponses = false;

    get memberId(): string {
        return this.member.id || "";
    }

    constructor(params: { member: CactusMember }) {
        const { member } = params;
        this.member = member;
    }

    async fetchData(): Promise<JournalEntry[]> {
        const memberId = this.memberId;
        const responseTask = AdminReflectionResponseService.getSharedInstance().getResponsesForMember(
        { memberId }
        );
        const sentPromptsTask = AdminSentPromptService.getSharedInstance().getAllForCactusMemberId(
        memberId
        );

        const [responses, sentPrompts] = await Promise.all([
            responseTask,
            sentPromptsTask
        ]);
        const promptContentTask: Promise<PromptContent | undefined>[] = [];
        sentPrompts.forEach(sp => {
            if (!sp.promptId) {
                promptContentTask.push(
                AdminPromptContentService.getSharedInstance().getByPromptId(
                sp.promptId
                )
                );
            }
        });

        const promptContents = await Promise.all(promptContentTask);
        const contentByPromptId: { [promptId: string]: PromptContent } = {};
        promptContents.reduce((map, promptContent) => {
            if (!promptContent || !promptContent.promptId) {
                return map;
            }
            map[promptContent.promptId] = promptContent;
            return map;
        }, contentByPromptId);

        const initialResponseMap: { [promptId: string]: ReflectionResponse[] } = {};
        const responsesByPromptId: {
            [promptId: string]: ReflectionResponse[];
        } = responses.reduce((previous, response) => {
            const promptId = response.promptId;

            if (!promptId) {
                return previous;
            }
            const characterCount =
            (response.content.text && response.content.text.length) || 0;

            if (this.redactResponses) {
                response.content = {
                    text: `redacted. Original Length was ${ characterCount }`
                };
            }

            const list = previous[promptId] || [];
            list.push(response);
            previous[promptId] = list;
            return previous;
        }, initialResponseMap);

        const feed: JournalEntry[] = [];

        sentPrompts.forEach(sentPrompt => {
            const promptId = sentPrompt.promptId;
            const journalResponses = promptId
            ? responsesByPromptId[promptId]
            : undefined;
            const promptContent = promptId ? contentByPromptId[promptId] : undefined;
            const entry: JournalEntry = {
                date: sentPrompt.firstSentAt,
                sentPrompt: sentPrompt,
                reflectionResponses: journalResponses,
                promptContent
            };
            feed.push(entry);
        });

        this.journalEntries = feed;

        return feed;
    }
}
