import {Message} from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import AdminSlackService from "@admin/services/AdminSlackService";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import CactusMember from "@shared/models/CactusMember";
import Logger from "@shared/Logger";
import AdminSubscriptionService from "@admin/services/AdminSubscriptionService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";

const logger = new Logger("ExpireMembershipTrialJob");

export async function onPublish(message: Message, context: functions.EventContext) {
    const job = new ExpireMembershipTrialJob();
    await job.expireAll();
    await job.sendDataLogMessage();
}

export interface ExpireMembershipJobResult {
    errors: string[];
    duration: number;
    numExpired: number,
    numSkipped: number,
}

export class ExpireMembershipTrialJob {
    errors: string[] = [];
    startTime!: Date;
    endTime!: Date;
    numExpired: number = 0;
    numSkipped: number = 0;


    async expireOne(options: { email?: string, memberId?: string }): Promise<void> {
        this.startTime = new Date();
        const {email, memberId} = options;
        try {
            const member = await AdminCactusMemberService.getSharedInstance().findCactusMember({
                email,
                cactusMemberId: memberId
            });
            if (member && member.isTrialExpired) {
                await this.expireMember(member);
            } else {
                this.errors.push(`No member found for options: ${stringifyJSON(options)}`);
            }
        } catch (error) {
            this.errors.push("Failed to run job: " + error.message);
        } finally {
            this.endTime = new Date()
        }
    }

    async expireAll(): Promise<void> {
        try {
            this.startTime = new Date();
            await AdminSubscriptionService.getSharedInstance().getMembersToExpireTrial({
                onData: (members, batchNumber) => this.handleMembersBatch(members, batchNumber)
            })

        } catch (error) {
            this.errors.push("Failed to run job: " + error.message);
        } finally {
            this.endTime = new Date()
        }
        return
    }

    async handleMembersBatch(members: CactusMember[], batchNumber: number): Promise<void> {
        logger.info(`Processing batch ${batchNumber}`);
        const tasks = members.map(member => this.expireMember(member));
        await Promise.all(tasks);
    }

    async expireMember(member: CactusMember): Promise<void> {
        if (!member.isTrialExpired) {
            logger.info(`member ${member.email} is not in trial, not expiring them`);
            return;
        }
        logger.info("Expiring member", member.email);
        const expireResult = await AdminSubscriptionService.getSharedInstance().expireTrial(member);
        if (expireResult.success) {
            this.numExpired++;
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
        };
    }

    async sendDataLogMessage() {
        await AdminSlackService.getSharedInstance().sendDataLogMessage(`\`ExpireMembershipTrialJob\`\n\`\`\`${stringifyJSON(this.getResult(), 2)}\`\`\``)
    }
}