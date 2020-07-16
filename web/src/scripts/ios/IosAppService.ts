import Logger from "@shared/Logger"
import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import { Config } from "@web/config";
import CactusMemberService from "@web/services/CactusMemberService";

const logger = new Logger("IosAppManager");

export default class IosAppService {
    static notifyAppMounted(mockRegister: boolean = false) {
        try {
            window.webkit.messageHandlers.appMounted.postMessage(true);
        } catch (error) {
            if (mockRegister || Config.isDev) {
                const currentMember = CactusMemberService.sharedInstance.currentMember;
                setTimeout(async () => {
                    const success = await window.CactusIosDelegate?.register(currentMember,
                    currentMember?.getFullName() ?? "Mock User Display Name",
                    currentMember?.tier ?? SubscriptionTier.BASIC)
                    logger.info("Mock register app result = ", success);
                }, 3000)
            } else {
                logger.error("Failed to post message to webkit", error);
            }
        }
    }

    static showPricing(): { error?: string } {
        try {
            window.webkit.messageHandlers.showPricing.postMessage(true);
            return {};
        } catch (error) {
            const errorMessage = error.message ?? "Unable to open the pricing page."
            logger.error("Failed to post message to webkit", error);
            return { error: errorMessage }
        }
    }
}

