import ReflectionResponse from "@shared/models/ReflectionResponse";
import Logger from "@shared/Logger"
import { isNull } from "@shared/util/ObjectUtil";
import { ChangeType, getChangeType, IChange } from "@admin/util/AdminFirestoreUtil";
import HoboCache from "@admin/HoboCache";
import { getAppTypeFromResponseMedium } from "@shared/util/ReflectionResponseUtil";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminRevenueCatService from "@admin/services/AdminRevenueCatService";
import { PromptType } from "@shared/models/ReflectionPrompt";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import SlackManager from "@admin/managers/SlackManager";
import CactusMember from "@shared/models/CactusMember";

const logger = new Logger("ReflectionManager");


export default class ReflectionManager {
    static shared = new ReflectionManager();

    async handleReflectionChange(change: IChange<ReflectionResponse>): Promise<void> {
        try {
            const { after } = change;
            const changeType = getChangeType(change)
            if (isNull(after) || changeType === ChangeType.DELETED) {
                logger.info("Not handling DELETED change type.");
                return;
            }

            const memberId = after.cactusMemberId;
            const { member } = await HoboCache.shared.getMemberById(memberId);

            await this.updateSentPromptsIfNeeded(change, member)
            await this.updateInsightsIfNeeded(change, member)

        } catch (error) {
            logger.error("Failed to handle change appropriately", error)
        }
    }

    async updateInsightsIfNeeded(change: IChange<ReflectionResponse>, member?: CactusMember | null) {
        try {
            const { after: currentResponse, before: previousResponse } = change;

            // fail fast where we can
            if (isNull(currentResponse)) {
                logger.info("Unable to get current reflection from snapshot");
                return;
            }

            const memberId = member?.id;
            const responseId = currentResponse.id;
            if (!memberId || !member || !responseId) {
                logger.warn("No member ID was found in the document snapshot");
                return;
            }

            const textBefore = previousResponse?.content?.text;
            const textAfter = currentResponse.content.text;
            const mightNeedInsights = currentResponse.mightNeedInsightsUpdate ?? false;
            const hasTextChanges = textBefore?.toLowerCase().trim() !== textAfter?.toLowerCase().trim()
            const hasAllInsights = currentResponse.hasAllInsights

            // If the reflection hasn't changed text and already has all of the insight values, set that the doc doesn't need changes.
            if (!hasTextChanges && mightNeedInsights && hasAllInsights) {
                logger.info("Change after exists, no text changes, but it might need changes, but all insights are present. Setting to doesn't need changes");
                await AdminReflectionResponseService.getSharedInstance().setMightNeedInsights(responseId, false);
                return;
            }

            // In any case, if there are no text changes and we don't think there may need to be insight updates, exit.
            if (!hasTextChanges && !mightNeedInsights) {
                logger.info("[update reflection stats trigger] Text hasn't changed, not processing");
                return;
            }

            // Update member last seen and log some other analytics stuff
            const appType = getAppTypeFromResponseMedium(currentResponse.responseMedium);

            await Promise.all([
                AdminReflectionResponseService.getSharedInstance().updateTextAnalysis(currentResponse),
                AdminCactusMemberService.getSharedInstance().updateStatsOnReflectionResponse(memberId),
                AdminRevenueCatService.shared.updateLastSeen({ memberId, appType: appType, updateLastSeen: true }),
                AdminRevenueCatService.shared.updateSubscriberAttributes(member)
            ])
        } catch (error) {
            logger.error("Failed to update insights for reflection response change", error)
        }
    }

    async updateSentPromptsIfNeeded(change: IChange<ReflectionResponse>, member?: CactusMember | null) {
        try {
            const { after: reflectionResponse, before } = change;
            const changeType = getChangeType(change)
            const promptId = reflectionResponse?.promptId;
            const memberId = member?.id;
            if (!reflectionResponse || !promptId || !memberId || !member) {
                logger.error("Failed to get a member id and/or a prompt ID off of ReflectionPrompt");
                return;
            }

            const sharingChanged = reflectionResponse.shared !== (before?.shared ?? false)
            if (sharingChanged && reflectionResponse.promptType === PromptType.FREE_FORM) {
                await AdminReflectionPromptService.getSharedInstance().updateSharingForReflection(reflectionResponse, member)
            }

            logger.info("Marking sent prompt as completed via upsert");
            const { created, sentPrompt } = await AdminSentPromptService.getSharedInstance().upsertSentPromptOnReflection(reflectionResponse, member)

            //slack messages
            if (changeType === ChangeType.CREATED) {
                await AdminCactusMemberService.getSharedInstance().updateLastReplyByMemberId(memberId, new Date());
                await SlackManager.shared.notifyMemberActivity({
                    member,
                    reflectionResponse,
                    sentPromptCreated: created,
                    sentPrompt
                })
            }
            return;
        } catch (error) {
            logger.error("Failed to process the ReflectionResponse.", error);
        }
    }
}