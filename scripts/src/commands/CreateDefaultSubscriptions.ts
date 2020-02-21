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
import {
    getDefaultSubscription,
    getDefaultSubscriptionWithEndDate,
    getDefaultTrial
} from "@shared/models/MemberSubscription";
import {DateTime} from "luxon";
import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";
import * as csv from "csvtojson"
import * as path from "path";
import helpers from "@scripts/helpers";
import {StringTransforms} from "@shared/util/StringUtil";

interface ExecuteCommandPrompt {
    runNow: boolean
}

interface MemberResult {
    error?: string,
    createdSubscription?: boolean,
    fixedSubscription?: boolean,
    legacyUpgrade?: boolean,
}

interface MemberBatchResult {
    batchNumber: number,
    numSubscriptionsCreated: number,
    numFixed: number,
    numSkipped: number,
    numLegacyUpgrade: number,
}

interface TotalResult {
    numSubscriptionsCreated: number,
    numSkipped: number,
    numFixed: number,
    numBatches: number,
    numLegacyUpgrade: number,
    trialEndDate: Date,
}


enum StripeInterval {
    month = "month",
    year = "year",
    week = "week",
}

interface LegacySubscriber {
    email: string,
    customerId?: string,
    activatedDate?: Date;
    subscriptionId?: string,
    interval?: StripeInterval,
    planId?: string,
    quantity?: number,
    amount?: number,
    created?: Date,
    start?: Date,
    canceledAt?: Date,
    cancelAtPeriodEnd?: boolean,
    currentPeriodEnd?: Date,
    currentPeriodStart?: Date,
}


export default class CreateDefaultSubscriptions extends FirebaseCommand {
    name = "Create Default Subscriptions";
    description = "Update all members that do not have a subscription";
    showInList = true;
    logger = new Logger("CreateDeefaultSubscriptoin");
    trialEndsAt = DateTime.local().set({
        month: 3,
        day: 1,
        year: 2020,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    }).toJSDate();

    legacySubscribers: { [email: string]: LegacySubscriber } = {};

    async parseLegacySubscribers(): Promise<{ [email: string]: LegacySubscriber }> {
        const filePath = path.join(helpers.dataDir, "legacy_subscribers.csv");
        console.log("file path", filePath);
        const rows: LegacySubscriber[] = (await csv().fromFile(filePath)).map((row: any) => {
            return {
                email: row.email,
                subscriptionId: StringTransforms.stringOrUndefined(row.subscriptionId),
                customerId: StringTransforms.stringOrUndefined(row.customerId),
                planId: StringTransforms.stringOrUndefined(row.plan),
                quantity: StringTransforms.numberOrUndefined(row.quantity),
                interval: StringTransforms.stringOrUndefined(row.status),
                created: StringTransforms.dateOrUndefined(row.created),
                start: StringTransforms.dateOrUndefined(row.start),
                cancelAtPeriodEnd: StringTransforms.booleanOrUndefined(row.cancelAtPeriodEnd),
                canceledAt: StringTransforms.dateOrUndefined(row.canceledAt),
                activatedDate: StringTransforms.dateOrUndefined(row.activatedDate),
                currentPeriodEnd: StringTransforms.dateOrUndefined(row.currentPeriodEnd),
                currentPeriodStart: StringTransforms.dateOrUndefined(row.currentPeriodStart)
            } as LegacySubscriber
        });

        console.log(`parsed ${rows.length} rows`);

        const subscriberMap: { [email: string]: LegacySubscriber } = {};

        rows.reduce((map, row) => {
            map[row.email] = row;
            return map
        }, subscriberMap);
        return subscriberMap;
    }


    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);


        const subMap = await this.parseLegacySubscribers();
        this.logger.info("Legacy Subscriber Map: ", JSON.stringify(subMap, null, 2));
        this.legacySubscribers = subMap;


        console.log("Using date func", Object.values(subMap)[0].start?.getTime());

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
        const total: TotalResult = {
            numSubscriptionsCreated: 0,
            numSkipped: 0,
            numFixed: 0,
            numBatches: batchResults.length,
            numLegacyUpgrade: 0,
            trialEndDate: this.trialEndsAt,
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

    /**
     *
     * @param {CactusMember} member
     * @param {FirebaseFirestore.WriteBatch} batch
     * @return {boolean} true if handled, false if not
     */
    async handleLegacySubscriber(member: CactusMember, batch: FirebaseFirestore.WriteBatch): Promise<MemberResult | undefined> {
        const email = member.email;
        if (!email) {
            return;
        }

        const legacy = this.legacySubscribers[email];
        if (!legacy) {
            return;
        }

        if (member.subscription?.stripeSubscriptionId && member.subscription.tier === SubscriptionTier.PLUS && !!member.subscription.trial?.activatedAt) {
            //already has all the data needed
            return {fixedSubscription: false, createdSubscription: false, legacyUpgrade: false};
        }

        const sub = member.subscription || getDefaultSubscription();
        const trial = sub.trial || getDefaultTrial();

        sub.tier = SubscriptionTier.PLUS;

        sub.stripeSubscriptionId = legacy.subscriptionId;
        member.stripeCustomerId = legacy.customerId;
        sub.subscriptionProductId = "LEGACY_IOS_APP";
        sub.legacyConversion = true;
        if (legacy.cancelAtPeriodEnd === true && legacy.currentPeriodEnd && legacy.start) {
            trial.endsAt = legacy.currentPeriodEnd;
            trial.startedAt = legacy.start;
            trial.activatedAt = null;
        } else {
            trial.startedAt = legacy.start || trial.startedAt;
            trial.endsAt = legacy.currentPeriodStart || trial.endsAt;
            trial.activatedAt = legacy.start || new Date();
        }

        sub.trial = trial;
        member.subscription = sub;

        await AdminCactusMemberService.getSharedInstance().save(member, {batch});

        return {fixedSubscription: true, createdSubscription: false, legacyUpgrade: true};
    }

    async processMember(member: CactusMember, batch: FirebaseFirestore.WriteBatch): Promise<MemberResult> {
        try {
            const legacyResult = await this.handleLegacySubscriber(member, batch);
            if (legacyResult) {
                return legacyResult;
            }

            if (member.subscription) {
                let save = false;
                const sub = member.subscription;
                if (sub.legacyConversion === undefined) {
                    sub.legacyConversion = false;
                    save = true;
                }

                if (sub.trial === undefined) {
                    sub.trial = getDefaultSubscriptionWithEndDate(this.trialEndsAt).trial;
                    save = true;
                } else if (!sub.trial.endsAt || !sub.trial.startedAt) {
                    sub.trial.endsAt = sub.trial.endsAt ?? this.trialEndsAt;
                    sub.trial.startedAt = sub.trial.startedAt ?? new Date();
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

                const sub = getDefaultSubscriptionWithEndDate(this.trialEndsAt);
                sub.legacyConversion = true;
                member.subscription = sub;
                await AdminCactusMemberService.getSharedInstance().save(member, {batch});
                return {createdSubscription: true, fixedSubscription: false};
            }
        } catch (error) {
            this.logger.error(`Unexected error while processing member ${member.email}`, error);
            return {error: error.message, createdSubscription: false, fixedSubscription: false};
        }
    }
}