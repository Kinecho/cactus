import CactusMember from "@shared/models/CactusMember";
import PromptContent from "@shared/models/PromptContent";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import SentPrompt from "@shared/models/SentPrompt";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";

interface JournalEntry {
    date?: Date;
    sentPrompt: SentPrompt;
    prompt?: ReflectionPrompt | undefined;
    reflectionResponses?: ReflectionResponse[];
    promptContent?: PromptContent;
}

interface JournalEntryJson {
    date?: string;
    sentPrompt: any;
    reflectionResponses?: any[];
    promptContent?: any;
}

interface SimpleDataEntry {
    date?: string,
    reflectionText?: string,
    question?: string,
}

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
        const responseTask = AdminReflectionResponseService.getSharedInstance().getResponsesForMember({ memberId });
        const sentPromptsTask = AdminSentPromptService.getSharedInstance().getAllForCactusMemberId(memberId);

        const [responses, sentPrompts] = await Promise.all([
            responseTask,
            sentPromptsTask
        ]);
        const promptContentTasks: Promise<PromptContent | undefined>[] = [];
        const reflectionPromptTasks: Promise<ReflectionPrompt | undefined>[] = [];
        sentPrompts.forEach(sp => {
            if (sp.promptId) {
                promptContentTasks.push(AdminPromptContentService.getSharedInstance().getByPromptId(sp.promptId));
                reflectionPromptTasks.push(AdminReflectionPromptService.getSharedInstance().get(sp.promptId));
            }
        });

        const promptContents = await Promise.all(promptContentTasks);
        const reflectionPrompts = await Promise.all(reflectionPromptTasks);

        const contentByPromptId: { [promptId: string]: PromptContent } = {};
        const promptsById: { [promptId: string]: ReflectionPrompt } = {};

        promptContents.reduce((map, promptContent) => {
            if (!promptContent || !promptContent.promptId) {
                return map;
            }
            map[promptContent.promptId] = promptContent;
            return map;
        }, contentByPromptId);

        reflectionPrompts.reduce((map: {[p:string]:ReflectionPrompt}, prompt: ReflectionPrompt | undefined) => {
            if (!prompt || !prompt.id) {
                return map;
            }
            map[prompt.id] = prompt;
            return map;
        }, promptsById);

        const initialResponseMap: { [promptId: string]: ReflectionResponse[] } = {};
        const responsesByPromptId: { [promptId: string]: ReflectionResponse[] } = responses.reduce((previous, response) => {
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
            const journalResponses = promptId ? responsesByPromptId[promptId] : undefined;
            const promptContent = promptId ? contentByPromptId[promptId] : undefined;
            const prompt = promptId ? promptsById[promptId] : undefined;
            const entry: JournalEntry = {
                date: sentPrompt.firstSentAt,
                sentPrompt: sentPrompt,
                prompt,
                reflectionResponses: journalResponses,
                promptContent
            };
            feed.push(entry);
        });

        this.journalEntries = feed;

        return feed;
    }

    toSimpleJSON(): SimpleDataEntry[] {
        return this.journalEntries.map(entry => {
            const obj: SimpleDataEntry = {
                date: entry.date && entry.date.toISOString(),
                reflectionText: (entry.reflectionResponses ?? []).map(r => r.content?.text).join("\n\n"),
                question: entry.promptContent?.getQuestion() ?? entry.prompt?.question
            };
            return obj;
        })
    }

    toJSON(): JournalEntryJson[] {
        return this.journalEntries.map(entry => {
            const obj: JournalEntryJson = {
                date: entry.date && entry.date.toISOString(),
                sentPrompt: entry.sentPrompt.toJSON(),
                reflectionResponses: (entry.reflectionResponses || []).map(resp => resp.toJSON()),
                promptContent: (entry.promptContent && entry.promptContent.toJSON()) || undefined
            };
            return obj;
        })
    }
}
