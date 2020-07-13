import FlamelinkModel, { SchemaName } from "@shared/FlamelinkModel";
import { isBlank } from "@shared/util/StringUtil";
import CactusMember from "@shared/models/CactusMember";
import { isPremiumTier } from "@shared/models/MemberSubscription";

enum Field {
    urlSlug = "urlSlug",
}


export class OfferDetails {
    entryId: string;
    displayName?: string;
    description?: string;
    /**
     * The date the user clicked the link that enabled the offer
     */
    appliedAt?: Date;
    trialDays?: number | null;
    redeemedAt?: Date | null;

    constructor(data: Partial<OfferDetails> & { entryId: string }) {
        Object.assign(this, data);
        this.entryId = data.entryId;
        this.appliedAt = data.appliedAt ? new Date(data.appliedAt) : undefined;
    }

    static fromJSON(json: any | null): OfferDetails | null {
        if (isBlank(json?.entryId)) {
            return null;
        }
        return new OfferDetails(json);
    }

    isMemberEligible(member?: CactusMember | null): boolean {
        if (!member) {
            return true;
        }

        if (member.hasTrialed) {
            return false;
        }
        if (isPremiumTier(member.tier)) {
            return false;
        }
        return true;
    }
}

export default class PromotionalOffer extends FlamelinkModel {
    static Field = Field;
    schema = SchemaName.promotionalOffer;
    urlSlug?: string;
    displayName?: string;
    continueUrl?: string;
    description?: string;
    trialDays?: number | null;

    constructor(data?: Partial<PromotionalOffer>) {
        super(data);
        Object.assign(this, data);
    }

    toOfferDetails(appliedAt: Date = new Date()): OfferDetails {
        return new OfferDetails({
            entryId: this.entryId,
            displayName: this.displayName,
            description: this.description,
            trialDays: this.trialDays,
            appliedAt,
        });
    }
}