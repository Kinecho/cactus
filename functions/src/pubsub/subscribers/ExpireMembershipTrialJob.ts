import {Message} from "firebase-functions/lib/providers/pubsub";
import AdminSlackService, {ChannelName} from "@admin/services/AdminSlackService";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import CactusMember from "@shared/models/CactusMember";
import Logger from "@shared/Logger";
import AdminSubscriptionService, {ExpireMembersJob} from "@admin/services/AdminSubscriptionService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import {PubSubService} from "@admin/pubsub/PubSubService";
import {PubSubTopic} from "@shared/types/PubSubTypes";
import {DEFAULT_BATCH_SIZE} from "@admin/services/AdminFirestoreService";
import {toTimestampMs} from "@shared/util/DateUtil";

const logger = new Logger("ExpireMembershipTrialJob");

export async function sendJob(job: ExpireMembersJob): Promise<string | undefined> {
    try {
        logger.info(`Submitting new job: ${stringifyJSON(job, 2)}`);
        const messageId = await PubSubService.getSharedInstance().pubsub.topic(PubSubTopic.expire_subscription_trials).publishJSON(job);
        logger.info("Submitted message id", messageId);
        return messageId;
    } catch (error) {
        logger.error(`Failed to submit job ${stringifyJSON(job)}`, error);
        return;
    }
}


export async function onPublish(message: Message) {
    const payload: ExpireMembersJob = message.json || {batchSize: DEFAULT_BATCH_SIZE, batchNumber: 0};
    payload.batchNumber = payload.batchNumber ?? 0;
    payload.batchSize = payload.batchSize || DEFAULT_BATCH_SIZE;
    const job = new ExpireMembershipTrialJob();
    // await job.expireAll();
    await job.expireBatch(payload);

    const nextJob = job.createNextBatchJob();
    if (nextJob) {
        await sendJob(nextJob);
    }

    await job.sendDataLogMessage();
}

export interface ExpireMembershipJobResult {
    errors: string[];
    duration: number;
    numExpired: number,
    numSkipped: number,
    batchNumber?: number,
    batchSize?: number,
    lastMemberId?: string,
    nextJob?: ExpireMembersJob
}

export class ExpireMembershipTrialJob {
    errors: string[] = [];
    startTime!: Date;
    endTime!: Date;
    numExpired: number = 0;
    numSkipped: number = 0;
    lastMember?: CactusMember;
    batchJob?: ExpireMembersJob;

    async expireOne(options: { email?: string, memberId?: string }): Promise<void> {
        this.startTime = new Date();
        const {email, memberId} = options;
        try {
            const member = await AdminCactusMemberService.getSharedInstance().findCactusMember({
                email,
                cactusMemberId: memberId
            });
            if (member && member.needsTrialExpiration) {
                await this.expireMemberTrial(member);
            } else {
                this.errors.push(`No member found for options: ${stringifyJSON(options)}`);
            }
        } catch (error) {
            logger.error(error);
            this.errors.push("Failed to run job: " + error.message);
        } finally {
            this.endTime = new Date()
        }
    }

    /**
     * Warning this can take a long time
     * @return {Promise<void>}
     */
    async expireAllDangerously(): Promise<void> {
        try {
            this.startTime = new Date();
            await AdminSubscriptionService.getSharedInstance().getMembersToExpireTrial({
                onData: (members, batchNumber) => this.handleMembersBatch(members, batchNumber)
            })
        } catch (error) {
            logger.error(error);
            this.errors.push("Failed to run job: " + error.message);
        } finally {
            this.endTime = new Date()
        }
        return
    }

    createNextBatchJob(): ExpireMembersJob | undefined {
        const job = this.batchJob;
        if (!job || !this.lastMember) {
            logger.info(`No data from which to create the next batch job. Current batch ${this.batchJob?.batchNumber ?? "unknown"}`);
            return undefined;
        }

        const nextJob: ExpireMembersJob = {
            batchNumber: job.batchNumber + 1,
            batchSize: job.batchSize,
            lastTrialEndsAt: toTimestampMs(this.lastMember?.subscription?.trial?.endsAt),
            lastMemberId: this.lastMember?.id,
        };
        logger.info("Created next job", stringifyJSON(nextJob, 2));
        return nextJob;
    }

    async expireBatch(job: ExpireMembersJob): Promise<void> {
        this.startTime = new Date();
        try {
            this.batchJob = job;
            const members = await AdminSubscriptionService.getSharedInstance().getMembersTrialEndedNotActivated(job);
            await this.handleMembersBatch(members, job.batchNumber);
        } catch (error) {
            logger.error("error with expire batch", error);
        } finally {
            this.endTime = new Date();
        }
    }

    async handleMembersBatch(members: CactusMember[], batchNumber: number): Promise<void> {
        logger.info(`Processing ${members.length} members in batch #${batchNumber}`);
        const tasks = members.map(member => this.expireMemberTrial(member));
        await Promise.all(tasks);
    }

    async expireMemberTrial(member: CactusMember): Promise<void> {
        if (!member.needsTrialExpiration) {
            logger.info(`member ${member.email} is not in trial, not expiring them`);
            return;
        }
        logger.info("Expiring member", member.email);
        const expireResult = await AdminSubscriptionService.getSharedInstance().expireTrial(member);
        if (expireResult.success) {
            this.numExpired++;
            this.lastMember = member;
        } else if (expireResult.error) {
            this.errors.push(expireResult.error)
        }
    }

    getResult(): ExpireMembershipJobResult {
        return {
            duration: this.endTime.getTime() - this.startTime.getTime(),
            errors: this.errors,
            numExpired: this.numExpired,
            numSkipped: this.numSkipped,
            batchNumber: this.batchJob?.batchNumber,
            batchSize: this.batchJob?.batchSize,
            lastMemberId: this.lastMember?.id,
            nextJob: this.createNextBatchJob(),
        };
    }

    async sendDataLogMessage() {
        await AdminSlackService.getSharedInstance().uploadTextSnippet({
            message: `:end: \`ExpireMembershipTrialJob\` Batch #${this.batchJob?.batchNumber ?? "unknown"}`,
            data: `${stringifyJSON(this.getResult(), 2)}`,
            fileType: "json",
            channel: ChannelName.data_log,
            filename: `$ExpireMembershipTrialJob-${new Date().toISOString()}.json`,
        })
    }
}