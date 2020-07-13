import PromotionalOffer, { OfferDetails } from "@shared/models/PromotionalOffer";
import StorageService, { LocalStorageKey } from "@web/services/StorageService";
import CactusMember from "@shared/models/CactusMember";
import CactusMemberService from "@web/services/CactusMemberService";
import Logger from "@shared/Logger"
import { isPremiumTier } from "@shared/models/MemberSubscription";
import { isAndroidApp } from "@web/DeviceUtil";
import { logOfferApplied, logOfferViewed } from "@web/analytics";
import RevenueCatService from "@web/services/RevenueCatService";

const logger = new Logger("PromotionalOfferManager");


export default class PromotionalOfferManager {
    public static shared = new PromotionalOfferManager();

    /**
     * Will always apply an existing offer if available.
     * Any existing offers on the member will be overwritten.
     *
     * If there is a current member, the offer is applied to the member record.
     * If not, the offer is saved in local storage.
     *
     * @param {PromotionalOffer} offer
     * @return {Promise<void>}
     */
    async applyOffer(offer: PromotionalOffer) {
        const member = await CactusMemberService.sharedInstance.getCurrentMember();
        await this.applyOfferDetails(offer.toOfferDetails(), member);
    }

    async applyOfferDetails(offerDetails: OfferDetails, member?: CactusMember | null) {
        const existingOffer = member?.currentOffer;

        if (!offerDetails.isMemberEligible(member)) {
            logger.info("Member is not eligible for promotions as they have already trialed.");
            await this.clearSessionOffers();
            return
        }
        logOfferViewed(offerDetails)
        if (member && existingOffer?.entryId !== offerDetails.entryId) {
            logger.info(`Going to apply offer ${ offerDetails.displayName } to member ${ member.email }`)
            member.currentOffer = offerDetails
            await CactusMemberService.sharedInstance.save(member);
            logOfferApplied(offerDetails)
            await RevenueCatService.shared.updateAttributes(member);
            logger.info(`Applied offer ${ offerDetails.displayName } to member ${ member.email }`);
            await this.clearSessionOffers();
        } else if (offerDetails.entryId === existingOffer?.entryId) {
            logger.warn("The member already has the current offer applied. Not overwriting it.");
            await this.clearSessionOffers();
        } else {
            StorageService.saveJSON(LocalStorageKey.offerDetails, offerDetails);
            logger.info("Saved offer to session");
        }
    }

    getSessionOfferDetails(): OfferDetails | null {
        const offerJson = StorageService.getJSON(LocalStorageKey.offerDetails);
        const offerDetails = OfferDetails.fromJSON(offerJson)
        if (!offerDetails) {
            StorageService.removeItem(LocalStorageKey.offerDetails);
            return null;
        }
        return offerDetails
    }

    async applySessionOffers(member?: CactusMember | null) {
        const offerDetails = this.getSessionOfferDetails();
        if (!offerDetails) {
            logger.debug("No offers were found on the session");
            return null;
        }

        await this.applyOfferDetails(offerDetails, member);
    }

    async clearSessionOffers() {
        StorageService.removeItem(LocalStorageKey.offerDetails);
        logger.info("Cleared offers from the session");
    }


    /**
     * Get the current offer for presentation. Pulls the offer from the member, if provided,
     * or from the session, if available.
     *
     * This method also ensures the current environment (Android/web) is able to display the offer.
     *
     * @param {CactusMember | undefined | null} member
     * @return {OfferDetails | null}
     */
    getCurrentOffer(member?: CactusMember | undefined | null): OfferDetails | null {
        const offer = member?.currentOffer ?? this.getSessionOfferDetails();
        if (isAndroidApp()) {
            return null;
        }
        return offer;
    }
}