import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import Logger from "@shared/Logger"

const logger = new Logger("IosAppDelegate");


export interface IosDelegate {
    register: (id: string, displayName: string, tier: SubscriptionTier) => Promise<string>
}

