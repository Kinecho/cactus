import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import {Collection} from "@shared/FirestoreBaseModels";
import * as prompts from "prompts";
import chalk from "chalk";
import {getISODateTime} from "@shared/util/DateUtil";
import Timestamp = admin.firestore.Timestamp;
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";

interface JobResult {
    deleted: boolean,
    error?: string,
    skipped: boolean,
    hasResponse: boolean,
}

export default class SentPromptsDuplicateCleanup extends FirebaseCommand {
    name = "Sent Prompts: Dupliciate Cleanup";
    description = "Remove prompts that were erroneously added more than once";
    showInList = true;

    userResponse!: { afterDate: Date, promptId: string, dryRun: boolean };

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        this.userResponse = await prompts([
            {
                message: "what is the promptId that should be deleted?",
                name: "promptId",
                type: "text",
            },
            {
                name: "afterDate",
                message: "What date should prompts be deleted after?",
                type: "date"
            },
            {
                name: "dryRun",
                message: "Do a dry run (don't actually delete anything)?",
                type: "confirm"
            }
        ]);

        const ts = admin.firestore.Timestamp.fromDate(this.userResponse.afterDate);
        console.log(chalk.green(`looking for prompts after ${getISODateTime(ts.toDate())}`));
        const collection = firestoreService.getCollectionRef(Collection.sentPrompts);
        const query = collection.where("promptId", "==", this.userResponse.promptId);
        const snapshot = await query.get();
        console.log(chalk.magenta(`Got ${snapshot.docs.length} documents`));

        const tasks: Promise<JobResult>[] = [];
        snapshot.docs.forEach(doc => {
            // console.log("got document", chalk.blue(JSON.stringify(doc.data())));
            tasks.push(this.handleSentPrompt(doc))

        });

        const jobResults = await Promise.all(tasks);
        console.log(`finished ${jobResults.length}`);
        let summary: { deleted: number, skipped: number, hasResponses: number, total: 0 } = {
            deleted: 0,
            skipped: 0,
            hasResponses: 0,
            total: 0
        };
        summary = jobResults.reduce((s, r) => {
            s.total += 1;
            s.deleted += r.deleted ? 1 : 0;
            s.hasResponses += r.hasResponse ? 1 : 0;
            s.skipped += r.skipped ? 1 : 0;
            return s;
        }, summary);

        console.log(chalk.green(JSON.stringify(summary, null, 2)));

        return;
    }

    async handleSentPrompt(doc: admin.firestore.DocumentSnapshot): Promise<JobResult> {
        const result: JobResult = {deleted: false, hasResponse: false, skipped: false};
        const documentCreated = doc.get("createdAt") as Timestamp;
        const promptId = doc.get("promptId") as string;
        if (documentCreated.toDate().getTime() < this.userResponse.afterDate.getTime()) {
            console.log("document created before the date we want to delete");
            result.skipped = true;
            return result;
        }

        const memberId = doc.get("cactusMemberId") as string;
        const memberEmail = doc.get("memberEmail") as string;
        const reflectionResponses = await AdminReflectionResponseService.getSharedInstance().getMemberResponsesForPromptId({
            memberId,
            promptId
        });
        if (reflectionResponses.length > 0) {
            console.log(`member ${memberId} ${memberEmail} has ${reflectionResponses.length} responses to the prompt`);
            result.hasResponse = true;
            return result
        }

        if (!this.userResponse.dryRun) {
            await doc.ref.delete();
        }

        result.deleted = true;

        return result;
    }
}