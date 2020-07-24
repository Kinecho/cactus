import {
    CreateFreeformParams,
    CreateFreeformResult,
    UpdateFreeformParams,
    UpdateFreeformResult
} from "@web/managers/ReflectionManagerTypes";
import ReflectionPrompt, { PromptType } from "@shared/models/ReflectionPrompt";
import { getAppType } from "@web/DeviceUtil";
import ReflectionPromptService from "@web/services/ReflectionPromptService";
import Logger from "@shared/Logger"
import ReflectionResponse from "@shared/models/ReflectionResponse";
import ReflectionResponseService from "@web/services/ReflectionResponseService";
import SentPrompt, { PromptSendMedium } from "@shared/models/SentPrompt";
import SentPromptService from "@web/services/SentPromptService";

const logger = new Logger("ReflectionManager");

const SAVE_ERROR = "Oops, something went wrong. Please try again later";

export default class ReflectionManager {
    static shared = new ReflectionManager();

    async updateFreeformReflection(params: UpdateFreeformParams): Promise<UpdateFreeformResult> {
        try {
            const { title, note, reflection, prompt, member, duration } = params;
            reflection.content.text = note;
            reflection.promptQuestion = title;
            reflection.reflectionDurationMs = (reflection.reflectionDurationMs ?? 0) + duration;
            prompt.question = title;

            const tasks: Promise<any>[] = [ReflectionResponseService.sharedInstance.save(reflection)]
            if (prompt.promptType === PromptType.FREE_FORM && prompt.memberId === member.id && member.id) {
                tasks.push(ReflectionPromptService.sharedInstance.save(prompt));
            }
            await Promise.all(tasks);
            return {
                success: true,
            }
        } catch (error) {
            logger.error("Failed to update existing freeform prompt")
            return { success: false, error: SAVE_ERROR };
        }
    }

    async createFreeformReflection(params: CreateFreeformParams): Promise<CreateFreeformResult> {
        try {
            const { note, title, member, duration, } = params;
            const prompt = ReflectionPrompt.createFreeForm({
                memberId: member.id!,
                app: getAppType(),
                question: title,
            })

            await ReflectionPromptService.sharedInstance.save(prompt)
            const promptId = prompt.id;
            if (!promptId) {
                return { success: false, error: SAVE_ERROR }
            }

            const sentPrompt = SentPrompt.create({
                memberId: member.id!,
                promptId,
                promptType: PromptType.FREE_FORM,
                createHistoryItem: false,
                memberEmail: member.email,
                medium: PromptSendMedium.FREE_FORM,
                userId: member.userId,
            })

            sentPrompt.completed = true;
            sentPrompt.completedAt = new Date();

            await SentPromptService.sharedInstance.save(sentPrompt);

            const reflection = ReflectionResponse.createFreeform({
                member,
                note,
                title,
                duration,
                promptId,
            })

            await ReflectionResponseService.sharedInstance.save(reflection)
            return {
                success: true,
                reflectionResponse: reflection,
                prompt,
                sentPrompt,
            }

        } catch (error) {
            logger.error("Failed to save freeform reflection.", error);

            return {
                success: false,
                error: SAVE_ERROR,
            }
        }
    }
}