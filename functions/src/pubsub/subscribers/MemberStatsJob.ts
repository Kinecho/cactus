import {Message} from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import * as Sentry from "@sentry/node"
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import CactusMember, {ReflectionStats} from "@shared/models/CactusMember";
import AdminSlackService from "@admin/services/AdminSlackService";
import Logger from "@shared/Logger";

const logger = new Logger("MemberStatsJob");

interface MemberStatResultAggregation {
    failedEmails: string[],
    successCount: number,
    errorCount: number,
}

export async function onPublish(message: Message, context: functions.EventContext) {
    const start = new Date().getTime();
    try {
        logger.log("Starting MemberStats job");
        const resultAgg: MemberStatResultAggregation = {
            failedEmails: [],
            successCount: 0,
            errorCount: 0
        };


        await AdminCactusMemberService.getSharedInstance().getAllBatch({
            batchSize: 500,
            onData: async (members, batchNumber) => {
                logger.log(`Processing batch ${batchNumber}`);
                const tasks: Promise<MemberStatResult>[] = members.map(handleMember);
                const results = await Promise.all(tasks);
                processResults(results, resultAgg);
                logger.log(`finished batch ${batchNumber} with ${results.length} results`);
                return results;
            }
        });
        const end = new Date().getTime();
        console.log("Finished all batches. Results:", JSON.stringify(resultAgg));
        await AdminSlackService.getSharedInstance().sendDataLogMessage(`:white_check_mark: Finished \`MemberStatsJob\` in ${end - start}ms`
            + `\n\`\`\`${JSON.stringify(resultAgg)}\`\`\``);

    } catch (error) {
        logger.error("Failed to process MemberStats job", error);
        Sentry.captureException(error);
        await AdminSlackService.getSharedInstance().sendEngineeringMessage(`:boom: An error occurred while running \`MemberStatsJob\`\n,\`\`\`${JSON.stringify(error)}\`\`\``)
    }
}

function processResults(results: MemberStatResult[], agg: MemberStatResultAggregation) {
    results.forEach(r => {
        if (!r) {
            return;
        }
        if (r.success) {
            agg.successCount += 1;
        } else {
            agg.errorCount += 1;
            agg.failedEmails.push(r.memberEmail || "Email not set");
        }
    })
}

interface MemberStatResult {
    success: boolean,
    memberId?: string,
    memberEmail?: string,
    error?: string,
    stats?: ReflectionStats
}

async function handleMember(member: CactusMember): Promise<MemberStatResult> {
    const memberId = member.id;
    const result: MemberStatResult = {memberId, memberEmail: member.email, success: false, error: undefined};
    if (!memberId) {
        result.error = `No member ID found for member ${member.email}, ${member.id}`;
        return result;
    }
    const timeZone = member.timeZone || undefined;
    try {
        const stats = await AdminReflectionResponseService.getSharedInstance().calculateStatsForMember({
            memberId,
            timeZone,
        }, {queryName: `calculateMemberStats.${member.email}`});
        result.stats = stats;
        if (stats) {
            await AdminCactusMemberService.getSharedInstance().setReflectionStats({
                memberId,
                stats: stats
            });
        }
        result.success = true;
        result.error = undefined;
        return result;
    } catch (error) {
        logger.error("Failed to update member stats for memberId", memberId);
        result.error = error.message || `Failed to update member stats for memberId=${memberId}`;
        return result;
    }
}