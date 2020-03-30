import { SubscriptionCancellation } from "@shared/models/MemberSubscription";
import AdminSubscriptionService, { CancelMembersBatch } from "@admin/services/AdminSubscriptionService";
import { toTimestampMs } from "@shared/util/DateUtil";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import CactusMember from "@shared/models/CactusMember";
import AdminFirestoreService, { Batch } from "@admin/services/AdminFirestoreService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import Logger from "@shared/Logger";
import { convertDateToTimestamp } from "@shared/util/FirestoreUtil";
import AdminSlackService, { ChannelName } from "@admin/services/AdminSlackService";

export enum CancellationResult {
    REMOVED_ACCESS = "REMOVED_ACCESS",
    ALREADY_CANCELED = "ALREADY_CANCELED",
    ERROR = "ERROR",
    NO_MEMBER = "NO_MEMBER",
    NO_SUBSCRIPTION = "NO_SUBSCRIPTION",
    NOT_READY_FOR_CANCELLATION = "NOT_READY_FOR_CANCELLATION",
}

export interface MemberCancellationResult {
    memberId?: string;
    email?: string;
    result: CancellationResult;
    cancellation?: SubscriptionCancellation;
}

export interface JobResult {
    results: MemberCancellationResult[];
}

export default class CancelSubscriptionJob {
    jobResult: JobResult = {
        results: []
    };
    startTime = new Date();
    endTime?: Date;
    batch?: CancelMembersBatch | undefined;
    logger = new Logger("CancelSubscriptionJob");
    lastMember?: CactusMember | undefined;

    async run(): Promise<JobResult> {
        // const members = await AdminSubscriptionService.getSharedInstance().getPremiumMembersWhereCancellationAccessHasEnded()
        let batch: CancelMembersBatch | undefined = this.createInitialBatchJob();

        while (batch !== undefined) {
            this.logger.info(`processing batch ${ batch.batchNumber }`);
            await this.processBatch(batch);
            batch = this.createNextBatchJob();
        }

        return this.jobResult;
    }

    async processBatch(batch: CancelMembersBatch) {
        this.startTime = new Date();
        try {
            this.batch = batch;
            this.lastMember = undefined;
            const members = await AdminSubscriptionService.getSharedInstance().getPremiumMembersWhereCancellationAccessHasEnded(batch);
            await this.handleMembersBatch(members, batch.batchNumber);
        } catch (error) {
            this.logger.error("error with expire batch", error);
        } finally {
            this.endTime = new Date();
        }
    }

    async handleMembersBatch(members: CactusMember[], batchNumber: number): Promise<void> {
        this.logger.info(`Processing ${ members.length } members in batch #${ batchNumber }`);
        const batchWrite = AdminFirestoreService.getSharedInstance().getBatch();
        const tasks = members.map(member => this.cancelMember(member, batchWrite));
        await batchWrite.commit();
        const memberResults = await Promise.all(tasks);
        this.jobResult.results.push(...memberResults);
    }

    async cancelMember(member: CactusMember, batchWrite: Batch): Promise<MemberCancellationResult> {
        const memberId = member.id;
        const email = member.email;
        if (!memberId) {
            return { memberId, email, result: CancellationResult.NO_MEMBER }
        }
        const subscription = member.subscription;
        if (!subscription) {
            return { memberId, email, result: CancellationResult.NO_SUBSCRIPTION }
        }

        if (subscription.tier === SubscriptionTier.BASIC) {
            return { memberId, email, result: CancellationResult.ALREADY_CANCELED }
        }

        const accessEndsAt = subscription.cancellation?.accessEndsAt;
        if (!subscription.cancellation || !accessEndsAt) {
            return { memberId, email, result: CancellationResult.NOT_READY_FOR_CANCELLATION };
        }

        if (accessEndsAt > this.startTime) {
            this.logger.info("Member's access ends in the future");
            return { memberId, email, result: CancellationResult.NOT_READY_FOR_CANCELLATION };
        }

        this.logger.info("Expiring member", member.email);
        subscription.cancellation.processedAt = new Date();
        subscription.tier = SubscriptionTier.BASIC;

        const memberRef = AdminCactusMemberService.getSharedInstance().getCollectionRef().doc(memberId);
        batchWrite.update(memberRef, { subscription: convertDateToTimestamp(subscription) });

        this.lastMember = member;
        return { memberId, email, result: CancellationResult.REMOVED_ACCESS };
    }

    createInitialBatchJob(): CancelMembersBatch {
        return {
            batchSize: 100,
            batchNumber: 0,
        }
    }

    createNextBatchJob(): CancelMembersBatch | undefined {
        const batch = this.batch;
        if (!batch || !this.lastMember) {
            this.logger.info(`No data from which to create the next batch job. Current batch ${ this.batch?.batchNumber ?? "unknown" }`);
            return undefined;
        }

        const nextBatch: CancelMembersBatch = {
            batchNumber: batch.batchNumber + 1,
            batchSize: batch.batchSize,
            lastAccessEndsAt: toTimestampMs(this.lastMember?.subscription?.cancellation?.accessEndsAt),
            lastMemberId: this.lastMember?.id,
        };
        this.logger.info("Created next batch object", stringifyJSON(nextBatch, 2));
        return nextBatch;
    }

    async sendSlackMessage() {
        await AdminSlackService.getSharedInstance().uploadTextSnippet({
            data: stringifyJSON(this.jobResult, 2),
            message: `Processed cancellations`,
            fileType: "json",
            filename: `cancellations-${new Date().toISOString()}.json`,
            channel: ChannelName.cancellation_processing,
        })
    }
}
