import { Message } from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import * as Sentry from "@sentry/node"
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import CactusMember, { ReflectionStats } from "@shared/models/CactusMember";
import AdminSlackService from "@admin/services/AdminSlackService";
import Logger from "@shared/Logger";
import AdminFirestoreService, { Batch } from "@admin/services/AdminFirestoreService";
import { chunkArray } from "@shared/util/ObjectUtil";
import { InsightWord } from "@shared/api/InsightLanguageTypes";

const logger = new Logger("MemberStatsJob");

interface MemberStatResultAggregation {
    failedEmails: string[],
    successCount: number,
    errorCount: number,
    error?: string,
    chunkErrors?: string[],
    duration?: number
}

export async function onPublish(message: Message, context: functions.EventContext) {
    try {
        await runMemberStatsJob(1500);
        return "Completed member stats job";
    } catch (error) {
        logger.error(error);
        return null;
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
    stats?: ReflectionStats,
    wordCloud?: InsightWord[]
}


async function handleMember(member: CactusMember, batch?: Batch): Promise<MemberStatResult> {
    const memberId = member.id;
    const result: MemberStatResult = { memberId, memberEmail: member.email, success: false, error: undefined };
    if (!memberId) {
        result.error = `No member ID found for member ${ member.email }, ${ member.id }`;
        return result;
    }
    const timeZone = member.timeZone || undefined;
    try {
        const stats = await AdminReflectionResponseService.getSharedInstance().calculateStatsForMember({
            memberId,
            timeZone,
        }, { queryName: `calculateMemberStats.${ member.email }` });

        result.stats = stats;

        const wordCloud = await AdminReflectionResponseService.getSharedInstance().aggregateWordInsightsForMember({
            memberId
        }, { queryName: `aggregateWordInsightsForMember.${ member.email }` });

        result.wordCloud = wordCloud;

        if (stats || wordCloud) {
            await AdminCactusMemberService.getSharedInstance().setStats({
                memberId,
                stats: stats,
                wordCloud: wordCloud,
                batch: batch,
            });
        }

        result.success = true;
        result.error = undefined;
        return result;
    } catch (error) {
        logger.error("Failed to update member stats for memberId", memberId);
        result.error = error.message || `Failed to update member stats for memberId=${ memberId }`;
        return result;
    }
}

export async function runMemberStatsJob(batchSize: number): Promise<MemberStatResultAggregation> {
    const start = new Date().getTime();
    const resultAgg: MemberStatResultAggregation = {
        failedEmails: [],
        successCount: 0,
        errorCount: 0,
        duration: 0
    };
    try {
        logger.log("Starting MemberStats job");

        await AdminCactusMemberService.getSharedInstance().getAllBatch({
            batchSize,
            onData: async (members, batchNumber) => {
                const batchStart = new Date().getTime();
                try {
                    logger.log(`Processing batch ${ batchNumber }`);
                    const memberChunks = chunkArray(members, 500);
                    const chunkTasks = memberChunks.map(async membersChunk => {
                        const batch = AdminFirestoreService.getSharedInstance().getBatch();
                        const memberTasks = membersChunk.map(member => handleMember(member, batch));
                        const memberResults = await Promise.all(memberTasks);
                        const commitResults = await batch.commit();
                        logger.info(`Committed batch for batch #${ batchNumber }. Results.length = ${ commitResults.length }`);
                        return memberResults
                    });

                    const chunkResults = await Promise.all(chunkTasks);

                    const results = chunkResults.reduce((allResults, c) => {
                        allResults.push(...c);
                        return allResults;
                    }, []);

                    processResults(results, resultAgg);
                    const batchEnd = new Date().getTime();
                    logger.log(`finished batch ${ batchNumber } in ${ batchEnd - batchStart }ms with ${ members.length } results and ${ memberChunks.length } chunks`);
                    return;
                } catch (error) {
                    logger.error(`Chunk ${ batchNumber } failed to process`, error);
                    const chunkErrors = resultAgg.chunkErrors || [];
                    chunkErrors.push(`Failed to process chunk ${ batchNumber }. ${ error.message }`);
                    resultAgg.chunkErrors = chunkErrors;
                    return;
                }
            }
        });
        const end = new Date().getTime();
        resultAgg.duration = end - start;
        console.log("Finished all batches. Results:", JSON.stringify(resultAgg));
        await AdminSlackService.getSharedInstance().sendDataLogMessage(`:white_check_mark: Finished \`MemberStatsJob\` in ${ ((end - start) / 1000).toFixed(2) }s`
        + `\n\`\`\`${ JSON.stringify(resultAgg, null, 2) }\`\`\``);

    } catch (error) {
        logger.error("Failed to process MemberStats job", error);
        Sentry.captureException(error);
        resultAgg.error = `Uncaught exception: ${ error.message }`;
        await AdminSlackService.getSharedInstance().sendEngineeringMessage(`:boom: An error occurred while running \`MemberStatsJob\`\n,\`\`\`${ JSON.stringify(error) }\`\`\``)
    }
    return resultAgg
}