import Logger from "@shared/Logger"
import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import { Config } from "@web/config";
import CactusMemberService from "@web/services/CactusMemberService";
import CactusMember from "@shared/models/CactusMember";

const logger = new Logger("IosAppManager");

export type WebkitMessageBody = string | boolean;

export interface WebkitMessageHandler<T extends WebkitMessageBody> {
    postMessage: (body: T) => void;
}

export interface IosAppInterface {
    closeCoreValues: WebkitMessageHandler<boolean>;
    appMounted: WebkitMessageHandler<boolean>;
    showPricing: WebkitMessageHandler<boolean>;
}

export default class IosAppService {
    static notifyAppMounted(mockRegister: boolean = false) {
        try {
            if (window.webkit?.messageHandlers?.appMounted) {
                window.webkit?.messageHandlers?.appMounted.postMessage(true);
            } else {
                if (mockRegister || Config.isDev) {
                    IosAppService.mockAppMounted()
                }
            }
        } catch (error) {
            if (mockRegister || Config.isDev) {
                IosAppService.mockAppMounted()
            } else {
                logger.error("Failed to post message to webkit", error);
            }
        }
    }

    static closeCoreValues(): { error?: string } {
        try {
            window.webkit?.messageHandlers?.closeCoreValues?.postMessage(true);
            return {};
        } catch (error) {
            logger.error("Failed to post message to webkit", error);
            return { error: error.message };
        }
    }

    static updateMember(member: CactusMember) {
        window.CactusIosDelegate?.register(member.id, member.getFullName(), member.tier)
    }

    protected static mockAppMounted() {
        logger.info("Mocking app mounted");
        const currentMember = CactusMemberService.sharedInstance.currentMember;

        setTimeout(async () => {
            const success = await window.CactusIosDelegate?.register(currentMember?.id ?? "none",
            currentMember?.getFullName() ?? "Mock User Display Name",
            currentMember?.tier ?? SubscriptionTier.BASIC)
            logger.info("Mock register app result = ", success);
        }, 3000)

    }

    static showPricing(): { error?: string } {
        try {
            window.webkit?.messageHandlers?.showPricing.postMessage(true);
            return {};
        } catch (error) {
            const errorMessage = error.message ?? "Unable to open the pricing page."
            logger.error("Failed to post message to webkit", error);
            return { error: errorMessage }
        }
    }
}

