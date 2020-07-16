import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import Logger from "@shared/Logger"

const logger = new Logger("IosAppDelegate");

type memberUpdateFunction = (id?: string|null, displayName?: string|null, tier?: SubscriptionTier|null) => Promise<string>

export interface IosDelegate {
    register: memberUpdateFunction,
    updateMember?: memberUpdateFunction,
}

