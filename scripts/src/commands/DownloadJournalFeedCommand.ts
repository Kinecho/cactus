import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@admin/CactusConfig";
import {Project} from "@scripts/config";
import * as prompts from "prompts";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import SentPrompt from "@shared/models/SentPrompt";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import PromptContent from "@shared/models/PromptContent";
import {writeToFile} from "@scripts/util/FileUtil";
import * as path from "path";
import helpers from "@scripts/helpers";
import * as chalk from "chalk";
import {exec} from "child_process";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";

interface UserInput {
    email: string,
    redactResponses: boolean,
    onlyText: boolean,
}

interface JournalEntry {
    date?: Date
    sentPrompt: SentPrompt
    reflectionResponses?: ReflectionResponse[]
    promptContent?: PromptContent;
}

interface JournalEntryJson {
    date?: string
    sentPrompt: any
    reflectionResponses?: any[]
    promptContent?: any;
}

export default class DownloadJournalFeedCommand extends FirebaseCommand {
    name = "Download User Feed";
    description = "Get a user's journal feed in order. Actual responses will be redacted";
    showInList = true;
    feed: JournalEntry[] = [];
    userInput!: UserInput;

    get redactResponses(): boolean {
        return this.userInput?.redactResponses ?? true
    }

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const userInput: UserInput = await prompts([{
            name: "email",
            message: "Member Email Address",
            type: "text"
        }, {
            name: "redactResponses",
            message: "Redact user reflections?",
            type: "confirm"
        }, {
            name: "onlyText",
            message: "Get Text",
            type: "confirm",
        }]);
        console.log("Got user input", userInput);
        this.userInput = userInput;

        const member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(userInput.email);
        if (!member || !member.id) {
            console.log("No member found for email ", userInput.email);
            return;
        }
        const memberId = member.id;
        console.log("Got cactus member ", member && member.id);


        this.feed = await this.buildFeed(memberId);

        let fileString = JSON.stringify(this.feedToJson(), null, 2)



        if (userInput.onlyText) {
            fileString = this.feed.map(entry => (entry.reflectionResponses ?? []).map(r => r.content.text).join("\n\n")).join("\n\n")
        }

        const filename = `DownloadUser_${project}_${userInput.email.replace("@", "_").replace(".", "_")}` + `_${new Date().getTime()}.json`;

        console.log();
        console.log(chalk.green("Saved to file", filename));
        console.log();
        const outputPath = path.resolve(helpers.outputDir, filename);

        await writeToFile(outputPath, fileString);

        const openResponse = await prompts({
            name: "open",
            message: "Open this file on your computer?",
            type: "confirm"
        });

        if (openResponse.open) {
            exec(`open ${outputPath}`);
        }

        return;
    }

    feedToJson(): JournalEntryJson[] {
        return this.feed.map(entry => {
            const obj: JournalEntryJson = {
                date: entry.date && entry.date.toISOString(),
                sentPrompt: entry.sentPrompt.toJSON(),
                reflectionResponses: (entry.reflectionResponses || []).map(resp => resp.toJSON()),
                promptContent: (entry.promptContent && entry.promptContent.toJSON()) || undefined
            };
            return obj;
        })
    }

    async buildFeed(memberId: string): Promise<JournalEntry[]> {
        const responseTask = AdminReflectionResponseService.getSharedInstance().getResponsesForMember({memberId});
        const sentPromptsTask = AdminSentPromptService.getSharedInstance().getAllForCactusMemberId(memberId);

        const [responses, sentPrompts] = await Promise.all([responseTask, sentPromptsTask]);
        const promptContentTask: Promise<PromptContent|undefined>[] = [];
        sentPrompts.forEach(sp => {
            if (!sp.promptId) {
                promptContentTask.push(AdminPromptContentService.getSharedInstance().getByPromptId(sp.promptId))
            }
        });

        const promptContents = await Promise.all(promptContentTask);
        const contentByPromptId: {[promptId: string]: PromptContent} = {};
        promptContents.reduce((map, promptContent) => {
            if (!promptContent || !promptContent.promptId) {
                return map;
            }
            map[promptContent.promptId] = promptContent;
            return map;

        }, contentByPromptId);

        const initialResponseMap: { [promptId: string]: ReflectionResponse[] } = {};
        const responsesByPromptId: { [promptId: string]: ReflectionResponse[] } = responses.reduce((previous, response) => {
            const promptId = response.promptId;

            if (!promptId) {
                return previous
            }
            const characterCount = (response.content.text && response.content.text.length) || 0;

            if (this.redactResponses) {
                response.content = {text: `redacted. Original Length was ${characterCount}`};
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
            const entry: JournalEntry = {
                date: sentPrompt.firstSentAt,
                sentPrompt: sentPrompt,
                reflectionResponses: journalResponses,
                promptContent,
            };
            feed.push(entry);

        });
        return feed;
    }

}