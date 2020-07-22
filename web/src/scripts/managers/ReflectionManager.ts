import { CreateFreeformParams, CreateFreeformResult } from "@web/managers/ReflectionManagerTypes";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import { getAppType } from "@web/DeviceUtil";
import ReflectionPromptService from "@web/services/ReflectionPromptService";
import Logger from "@shared/Logger"
import ReflectionResponse from "@shared/models/ReflectionResponse";
import ReflectionResponseService from "@web/services/ReflectionResponseService";

const logger = new Logger("ReflectionManager");


const SAVE_ERROR = "Oops, something went wrong. Please try again later";

export default class ReflectionManager {
    static shared = new ReflectionManager();

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