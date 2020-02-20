import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import * as prompts from "prompts";
import CactusMember from "@shared/models/CactusMember";
import Logger from "@shared/Logger";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import {stringifyJSON} from "@shared/util/ObjectUtil";

interface ExecuteCommandPrompt {
    runNow: boolean
}

interface MemberResult {
    error?: string,
    createdSubscription: boolean,
    hadSubscription: boolean,
}

interface MemberBatchResult {
    batchNumber: number,
}

export default class CreateDefaultSubscriptions extends FirebaseCommand {
    name = "Create Default Subscriptions";
    description = "Update all members that do not have a subscription";
    showInList = true;
    logger = new Logger("CreateDeefaultSubscriptoin");

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const doIt = await this.shouldExecute("Start the backfill now?");
        if (doIt) {
            await this.process();
        }

        return;
    }

    async shouldExecute(message: string = "Run the command?"): Promise<boolean> {
        const userInput: ExecuteCommandPrompt = await prompts([{
            name: "runNow",
            message: message,
            type: "confirm"
        }]);

        return userInput.runNow;
    }

    async process(): Promise<void> {
        const startTime = Date.now();
        this.logger.info("Starting backfill job");

        const batchResults: MemberBatchResult[] = [];
        await AdminCactusMemberService.getSharedInstance().getAllBatch({
            batchSize: 500,
            onData: async (members, batchNumber) => {
                const batchStart = Date.now();
                this.logger.info("Processing batch", batchNumber);
                const batchResult = await this.handleMemberBatch(members, batchNumber);
                const batchEnd = Date.now();
                this.logger.info(`Finished batch ${batchNumber} after ${batchEnd - batchStart}ms`);
                batchResults.push(batchResult);
            }
        });
        const endTime = Date.now();

        await this.reportResults(batchResults, endTime - startTime);

        const again = await this.shouldExecute("Run it again?");
        if (again) {
            return this.process();
        }
        return;
    }

    async reportResults(batchResults: MemberBatchResult[], totalDuration: number,): Promise<void> {
        this.logger.info(`\n\nFinished after ${totalDuration}ms\nResults: \n `, stringifyJSON(batchResults, 2));
        return;
    }

    async handleMemberBatch(members: CactusMember[], batchNumber: number): Promise<MemberBatchResult> {
        const batch = AdminFirestoreService.getSharedInstance().getBatch();
        const tasks = members.map(member => {
            return this.processMember(member, batch);
        });

        const results = await Promise.all(tasks);
        const commitResult = await batch.commit();
        return this.createBatchResult(results, commitResult, batchNumber);

        return {batchNumber}
    }

    createBatchResult(memberResults: MemberResult[], batchResults: FirebaseFirestore.WriteResult[], batchNumber: number): MemberBatchResult {
        return {
            batchNumber,
        }
    }

    async processMember(member: CactusMember, batch: FirebaseFirestore.WriteBatch): Promise<MemberResult> {


        return {createdSubscription: false, error: undefined, hadSubscription: false};
    }

}