import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {Project} from "@scripts/config";
import {CactusConfig} from "@shared/CactusConfig";
import {isValidEmail} from "@shared/util/StringUtil";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import CactusMember from "@shared/models/CactusMember";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import {DateTime} from "luxon";
import AdminReflectionPromptService from "@shared/services/AdminReflectionPromptService";
import SentPrompt, {PromptSendMedium} from "@shared/models/SentPrompt";
import AdminSentPromptService from "@shared/services/AdminSentPromptService";
import AdminReflectionResponseService from "@shared/services/AdminReflectionResponseService";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import axios from "axios";
import {transformObjectSync} from "@shared/util/ObjectUtil";
import md5 = require("md5");

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
            await this.deleteExisting(member);
        }

        await this.generatePrompts(member, userResponse.numPrompts);


        return;
    }

    async deleteExisting(member: CactusMember) {
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

    async generatePrompts(member: CactusMember, numPrompts: number) {
        console.log("creating prompts...");
        const tasks = [];
        const triviaQuestions = await this.fetchTriviaQuestions(numPrompts);

        for (let i = 0; i < numPrompts; i++) {
            tasks.push(new Promise(async resolve => {
                try {
                    const prompt = new ReflectionPrompt();
                    const trivia = triviaQuestions[i % triviaQuestions.length];
                    const promptId = `auto_test_${md5(trivia.question)}`;
                    prompt.id = promptId;
                    prompt.question = `Question ${i + 1}: ${decodeURIComponent(trivia.question)}`;
                    prompt.sendDate = DateTime.fromJSDate(new Date()).minus({days: numPrompts - i}).toJSDate();
                    prompt.contentPath = `/test-${i + 1}`;

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
            console.log("fetched questions batch", data.results);
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

        console.log(`fetched ${questions.length} questions. ${questions[0]}`);
        return questions;

    }

}
