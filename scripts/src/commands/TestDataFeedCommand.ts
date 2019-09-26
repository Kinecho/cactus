import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {Project} from "@scripts/config";
import {CactusConfig} from "@shared/CactusConfig";
import {isValidEmail} from "@shared/util/StringUtil";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import CactusMember from "@shared/models/CactusMember";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import {DateTime} from "luxon";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import SentPrompt, {PromptSendMedium} from "@shared/models/SentPrompt";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import axios from "axios";
import {transformObjectSync} from "@shared/util/ObjectUtil";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import md5 = require("md5");
import PromptContent from "@shared/models/PromptContent";

const prompts = require("prompts");

interface TriviaQuestion {
    category: string,
    type: string,
    difficulty: string,
    question: string,
    correct_answer: string,
    incorrect_answers: string[]
}


export default class TestDataFeedCommand extends FirebaseCommand {
    name = "Test Data: Create Feed";
    description = "Create a bunch of records for use in testing";
    showInList = true;
    project = Project.STAGE;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project;

        console.log("Using project", project);

        const userResponse: { email: string, numPrompts: number, deleteExisting: boolean } = await prompts([
            {
                message: "User Email to create data for",
                name: "email",
                type: "text",
                validate: (value: string) => isValidEmail(value.trim()) || "Please enter a valid email",
                format: (value: string) => value.trim().toLowerCase(),
            },
            {
                message: "How many prompts should be created?",
                name: "numPrompts",
                type: "number",
                initial: 100,
            }, {
                message: "Delete existing sends for user?",
                type: "confirm",
                name: "deleteExisting",
            }
        ]);

        console.log(`creating data for '${userResponse.email}'`);
        console.log("Fetching prompt content entries...");
        const promptContentEntries = await AdminPromptContentService.getSharedInstance().getAll();
        console.log(`Fetched ${promptContentEntries.length} content entries from flamelink ${config.flamelink.service_account.project_id} - ${config.flamelink.environment_id}`);

        let makeUpPrompts = false;
        if (userResponse.numPrompts > promptContentEntries.length) {
            const confirmResponse: { confirm: boolean } = await prompts({
                message: `You requested ${userResponse.numPrompts}. There are only ${promptContentEntries.length} Prompt Content entries available - do you want to create prompts without the content module? Say no to only create ${promptContentEntries.length}.`,
                type: "confirm",
                name: "confirm"
            });

            if (confirmResponse.confirm) {
                makeUpPrompts = true;
            }
        }


        let member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(userResponse.email);
        if (!member) {
            const createMemberResponse: { confirmCreate: boolean } = await prompts({
                name: "confirmCreate",
                message: `No member was found for email ${userResponse.email}. Create them now?`,
                type: "confirm"
            });

            if (!createMemberResponse.confirmCreate) {
                console.log("not creating the member. Exiting.");
                return;
            }

            member = new CactusMember();
            member.email = userResponse.email;
            member = await AdminCactusMemberService.getSharedInstance().save(member);
            console.log(`Saved new member. id=${member.id}`);
        }

        if (!member || !member.id) {
            console.error("Still don't have a member. Can't continue");
            return;
        }

        if (userResponse.deleteExisting) {
            await this.deleteExistingFeed(member);
        }

        const numPrompts = makeUpPrompts ? userResponse.numPrompts : promptContentEntries.length;

        await this.generatePrompts(member, numPrompts, promptContentEntries);


        return;
    }

    async deleteExistingFeed(member: CactusMember) {
        const firestoreService = AdminFirestoreService.getSharedInstance();
        let batch = firestoreService.firestore.batch();
        if (member.id) {
            const existingSentPrompts = await AdminSentPromptService.getSharedInstance().getAllForCactusMemberId(member.id);
            existingSentPrompts.forEach(prompt => {
                if (prompt.id) {
                    batch.delete(AdminSentPromptService.getSharedInstance().getCollectionRef().doc(prompt.id));
                }
            });

            await batch.commit();

            batch = firestoreService.firestore.batch();
            const responsesSnapshot = await AdminReflectionResponseService.getSharedInstance()
                .getCollectionRef()
                .where(ReflectionResponse.Field.cactusMemberId, "==", member.id)
                .get();
            responsesSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

        }

    }

    async upsertPromptForPromptContent(promptContent: PromptContent, daysBack: number): Promise<ReflectionPrompt | undefined> {
        const promptId: string | undefined = promptContent.promptId;
        let prompt: ReflectionPrompt | undefined = undefined;
        if (promptId) {
            prompt = await AdminReflectionPromptService.getSharedInstance().get(promptId);
        }

        if (!prompt) {
            prompt = new ReflectionPrompt();
            prompt.sendDate = DateTime.fromJSDate(new Date()).minus({days: daysBack}).toJSDate();
            prompt.id = promptId;
        }

        if (!prompt) {
            console.error(`Something went wrong and we don't have a prompt still. Not processing promptId for prompt content ${promptContent.promptId}`);
            return;
        }

        prompt.topic = promptContent.topic;
        prompt.question = promptContent.getQuestion();

        if (!prompt.sendDate) {
            prompt.sendDate = DateTime.fromJSDate(new Date()).minus({days: daysBack}).toJSDate();
        }

        console.log("question", prompt.question);
        prompt.promptContentEntryId = promptContent.entryId;
        console.log("set promptContentEntryId", promptContent.entryId);

        console.log("Saving Content Prompt", prompt.toJSON());
        return await AdminReflectionPromptService.getSharedInstance().save(prompt);
    }

    async createSentPrompt(options: { member: CactusMember, prompt: ReflectionPrompt }): Promise<SentPrompt | undefined> {
        const {member, prompt} = options;
        const promptId = prompt.id;
        const sentPrompt = new SentPrompt();
        sentPrompt.promptId = promptId;
        sentPrompt.cactusMemberId = member.id;
        sentPrompt.id = `${member.id}_${prompt.id}`;
        sentPrompt.firstSentAt = prompt.sendDate;
        sentPrompt.lastSentAt = prompt.sendDate;
        sentPrompt.memberEmail = member.email;
        sentPrompt.createdAt = new Date();
        sentPrompt.sendHistory.push({
            medium: PromptSendMedium.EMAIL_MAILCHIMP,
            email: member.email,
            sendDate: prompt.sendDate || new Date()
        });

        return await AdminSentPromptService.getSharedInstance().save(sentPrompt);
    }

    async generatePrompts(member: CactusMember, numPrompts: number, promptContentEntries: PromptContent[]): Promise<void> {
        console.log(`creating ${numPrompts} sent prompts...`);
        const tasks: Promise<SentPrompt | undefined>[] = [];
        const contentTasks: Promise<SentPrompt | undefined>[] = [];

        promptContentEntries.slice(0, numPrompts).forEach((promptContent, i) => {
            contentTasks.push(new Promise<SentPrompt | undefined>(async resolve => {
                const prompt = await this.upsertPromptForPromptContent(promptContent, i);
                if (prompt) {
                    const sentPrompt = this.createSentPrompt({member, prompt});
                    resolve(sentPrompt);
                    return;
                } else {
                    resolve(undefined);
                }
            }))
        });

        const contentSentPromptResults = await Promise.all(contentTasks);
        const contentSentPrompts = contentSentPromptResults.filter(Boolean) as SentPrompt[];
        console.log(`Created ${contentSentPrompts.length} sent prompts from prompt content`);

        if (contentSentPrompts.length === numPrompts) {
            console.log("Created all the SentPrompts needed. Returning");
            return;
        }


        const remainingPrompts = numPrompts - contentSentPrompts.length;
        const triviaQuestions = await this.fetchTriviaQuestions(remainingPrompts);

        for (let i = 0; i < remainingPrompts; i++) {
            tasks.push(new Promise<SentPrompt | undefined>(async resolve => {
                try {
                    const prompt = new ReflectionPrompt();
                    const trivia = triviaQuestions[i % triviaQuestions.length];
                    const promptId = `auto_test_${md5(trivia.question)}`;
                    prompt.id = promptId;
                    prompt.question = `Question: ${decodeURIComponent(trivia.question)}\n${promptId}`;
                    prompt.sendDate = DateTime.fromJSDate(new Date()).minus({days: contentSentPrompts.length + i}).toJSDate();
                    // prompt.contentPath = `/test-${i + 1}`;

                    await AdminReflectionPromptService.getSharedInstance().save(prompt);


                    const sentPrompt = new SentPrompt();
                    sentPrompt.promptId = promptId;
                    sentPrompt.cactusMemberId = member.id;
                    sentPrompt.id = `${member.id}_${prompt.id}`;
                    sentPrompt.firstSentAt = prompt.sendDate;
                    sentPrompt.lastSentAt = prompt.sendDate;
                    sentPrompt.memberEmail = member.email;
                    sentPrompt.createdAt = new Date();
                    sentPrompt.sendHistory.push({
                        medium: PromptSendMedium.EMAIL_MAILCHIMP,
                        email: member.email,
                        sendDate: prompt.sendDate
                    });

                    await AdminSentPromptService.getSharedInstance().save(sentPrompt);

                    resolve();
                } catch (e) {
                    console.log("Failed to process the prompt", e);
                    resolve()
                }

            }));
        }
        await Promise.all(tasks);
        console.log(`finished creating ${tasks.length} prompts`);
    }

    async fetchTriviaQuestions(count: number): Promise<TriviaQuestion[]> {
        const questions: TriviaQuestion[] = [];

        while (questions.length < count) {
            console.log('fetching questions');
            const batchSize = Math.min(50, count - questions.length);
            console.log("fetching", batchSize, "questions");
            const {data} = await axios.get(`https://opentdb.com/api.php?amount=${batchSize}&encode=base64`);
            console.log("fetched questions batch");
            const processed = data.results.map((question: TriviaQuestion) => {

                const transform = (value: any) => {
                    if (typeof value === "string") {
                        const buff = Buffer.from(value, "base64");
                        return buff.toString("ascii");
                    }
                    return value;
                };
                return transformObjectSync(question, transform);

            });
            questions.push(...processed);
        }

        console.log(`fetched ${questions.length} questions.`);
        return questions;

    }

}
