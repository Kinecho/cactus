import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import CactusMember from "@shared/models/CactusMember";
import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";
import {getDefaultSubscription, getDefaultTrial} from "@shared/models/MemberSubscription";
import Logger from "@shared/Logger";
import {MemberBatchResult, MemberResult, TotalResult} from "@scripts/commands/CreateDefaultSubscriptions";


export default class BackfillSubscriptionActivated extends FirebaseCommand {
    name = "Backfill Subscription Activated";
    description = "Ensure members have the correct activated flag on their subscriptions";
    showInList = true;
    logger = new Logger("BackfillSubscriptionActivated");

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);


        await this.process();
        return;

    }

    async reportResults(batchResults: MemberBatchResult[], totalDuration: number,): Promise<void> {
        const total: TotalResult = {
            numSubscriptionsCreated: 0,
            numSkipped: 0,
            numFixed: 0,
            numBatches: batchResults.length,
            numLegacyUpgrade: 0,
            trialEndDate: new Date(),
        };

        batchResults.forEach(r => {
            total.numSkipped += r.numSkipped;
            total.numFixed += r.numFixed;
            total.numLegacyUpgrade += r.numLegacyUpgrade;
            total.numSubscriptionsCreated += r.numSubscriptionsCreated;
        });

        this.logger.info(`\n\nFinished after ${totalDuration}ms\nResults: \n `, stringifyJSON(total, 2));
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
    }

    createBatchResult(memberResults: MemberResult[], batchResults: FirebaseFirestore.WriteResult[], batchNumber: number): MemberBatchResult {
        const total = {
            batchNumber,
            numSubscriptionsCreated: 0,
            numSkipped: 0,
            numFixed: 0,
            numLegacyUpgrade: 0,
        };

        memberResults.forEach(r => {
            total.numSkipped += r.createdSubscription ? 0 : 1;
            total.numFixed += r.fixedSubscription ? 1 : 0;
            total.numLegacyUpgrade += r.legacyUpgrade ? 1 : 0;
            total.numSubscriptionsCreated += r.createdSubscription ? 1 : 0;
        });

        return total;
    }

    async processMember(member: CactusMember, batch: FirebaseFirestore.WriteBatch): Promise<MemberResult> {
        try {
            if (member.subscription) {
                let save = false;
                const sub = member.subscription;
                if (sub.legacyConversion === undefined) {
                    sub.legacyConversion = false;
                    save = true;
                }

                if (sub.trial === undefined) {
                    sub.trial = getDefaultTrial();
                    save = true;
                }

                const isActivated = !!sub.trial?.activatedAt;
                if (isActivated !== sub.activated) {
                    this.logger.info(`setting ${member.email} subscription to activated = ${isActivated}`);
                    sub.activated = isActivated;
                    save = true;
                }

                if (!sub.tier) {
                    sub.tier = SubscriptionTier.PLUS;
                    save = true;
                }

                if (save) {
                    await AdminCactusMemberService.getSharedInstance().save(member, {batch});
                    return {createdSubscription: false, fixedSubscription: true};
                }
                return {createdSubscription: false, fixedSubscription: false};
            } else {
                member.subscription = getDefaultSubscription();
                await AdminCactusMemberService.getSharedInstance().save(member, {batch});
                return {createdSubscription: true, fixedSubscription: false};
            }
        } catch (error) {
            this.logger.error(`Unexpected error while processing member ${member.email}`, error);
            return {error: error.message, createdSubscription: false, fixedSubscription: false};
        }
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

        return;
    }


}