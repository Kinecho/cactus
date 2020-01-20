import {Message} from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import * as Sentry from "@sentry/node"
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import CactusMember from "@shared/models/CactusMember";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import AdminSlackService from "@admin/services/AdminSlackService";
import Logger from "@shared/Logger";
const logger = new Logger("MemberStatsJob");
export async function onPublish(message: Message, context: functions.EventContext) {
    try {
        logger.log("Starting MemberStats job");

        await AdminCactusMemberService.getSharedInstance().getAllBatch({
            batchSize: 500,
            onData: async (members, batchNumber) => {
                logger.log(`Processing batch ${batchNumber}`);
                const tasks: Promise<void>[] = members.map(handleMember);
                await Promise.all(tasks);
                logger.log(`finished batch ${batchNumber}`);
                return;
            }
        });

    } catch (error) {
        logger.error("Failed to process MemberStats job", error);
        Sentry.captureException(error);
        await AdminSlackService.getSharedInstance().sendEngineeringMessage(`:boom: An error occurred while running \`MemberStatsJob\`\n,\`\`\`${JSON.stringify(error)}\`\`\``)
    }
}

async function handleMember(member: CactusMember) {
    const memberId = member.id;
    if (!memberId) {
        return;
    }
    const timeZone = member.timeZone || undefined;
    await AdminFirestoreService.getSharedInstance().runTransaction(async t => {
        try {
            const stats = await AdminReflectionResponseService.getSharedInstance().calculateStatsForMember({
                memberId,
                timeZone,
            }, {transaction: t, queryName: "calculateMemberStats"});

            if (stats) {
                await AdminCactusMemberService.getSharedInstance().setReflectionStats({
                    memberId,
                    stats: stats
                }, {transaction: t});
            }
            return {success: true};
        } catch (error) {
            logger.error("Failed to update member stats for memberId", memberId);
            return {success: false};
        }
    });

    return;
}