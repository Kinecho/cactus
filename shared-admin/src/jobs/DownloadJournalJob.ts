import CactusMember from "@shared/models/CactusMember";
import PromptContent from "@shared/models/PromptContent";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import SentPrompt from "@shared/models/SentPrompt";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import { formatDate, formatDateTime } from "@shared/util/DateUtil";
import { CactusConfig } from "@shared/CactusConfig";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import Logger from "@shared/Logger";
import { ArchiverError } from "archiver";
import { promisify } from "util";
const jsoncsv = require("json-csv");

const archiver = require("archiver");
const path = require("path");
const fs = require("fs-extra");

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
    config: CactusConfig;
    outputDir = "/tmp";
    logger = new Logger("DownloadJournalJob");

    get memberId(): string {
        return this.member.id || "";
    }

    constructor(params: { member: CactusMember, config: CactusConfig }) {
        const { member, config } = params;
        this.member = member;
        this.config = config;
        if (config.isEmulator) {
            this.outputDir = path.join(__dirname, "output");
        }
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

        reflectionPrompts.reduce((map: { [p: string]: ReflectionPrompt }, prompt: ReflectionPrompt | undefined) => {
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
                date: formatDateTime(entry.date, {timezone: this.member?.timeZone, format: "yyyy-LL-dd h:mm:ss a"}),
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

    async toCsv(): Promise<string> {
        /*
            date?: string,
            reflectionText?: string,
            question?: string,
         */
        const json = this.toSimpleJSON();
        return await jsoncsv.buffered(json, {
            fields: [{
                name: "date",
                label: "Date",
                quoted: false,
            }, {
                name: "question",
                label: "Question",
                quoted: true,
            }, {
                name: "reflectionText",
                label: "Reflection Text",
                quoted: true,
            }]

        });
    }

    /**
     * Create a zip of various data sources
     * @return {Promise<string>} the file path
     */
    async zip(): Promise<string | undefined> {
        return new Promise<string | undefined>(async resolve => {
            try {
                const dateString = formatDate(new Date());
                const filePath = path.resolve(this.outputDir, `cactus-member-data-${ this.member.id }-${ dateString }.zip`);
                this.logger.info("Using file path for the zip file: ", filePath);
                const folder = this.outputDir;
                try {
                    await fs.mkdirp(folder, { recursive: true });
                    this.logger.info("made directory");
                } catch (error) {
                    this.logger.error("Unable to create folder " + folder, error);
                }

                try {
                    await promisify(fs.writeFile)(filePath, "");
                } catch (error) {
                    this.logger.error("Failed to write to file", filePath, error);
                    resolve(undefined);
                    return
                }

                const output = fs.createWriteStream(filePath);

                const archive = archiver('zip', {
                    zlib: { level: 9 }
                });

                output.on('close', () => {
                    this.logger.info(archive.pointer() + " total bytes");
                    this.logger.info("Write stream closed");
                });

                output.on('end', () => {
                    this.logger.info("Data has been drained");
                });

                archive.on("warning", (err: ArchiverError) => {
                    if (err.code === 'ENOENT') {
                        this.logger.warn("Warning, ENOENT", err);
                    } else {
                        this.logger.warn('warning with error', err);
                        throw err;
                    }
                });

                archive.on('error', (err: ArchiverError) => {
                    this.logger.error("archive error", err);
                    throw err;
                });

                archive.pipe(output);

                archive.append(stringifyJSON(this.toSimpleJSON()), { name: "user_data.json" });
                archive.append(await this.toCsv(), { name: "user_data.csv" });

                await archive.finalize();
                this.logger.info("Archiver finalized");
                resolve(filePath);
                return

            } catch (error) {
                this.logger.error("Failed to create zip file", error);
                resolve(undefined);
                return;
            }

        });

    }
}
