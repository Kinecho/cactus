import FlamelinkService, { FlamelinkModelService } from "@web/services/FlamelinkService";
import PromptContent from "@shared/models/PromptContent";
import PromotionalOffer from "@shared/models/PromotionalOffer";
import Logger from "@shared/Logger"
import { isBlank } from "@shared/util/StringUtil";

const logger = new Logger("PromotionalOfferService");


export default class PromotionalOfferService extends FlamelinkModelService<PromotionalOffer> {
    public static shared = new PromotionalOfferService();
    Type = PromotionalOffer;

    // flamelink = FlamelinkService.sharedInstance;

    constructor() {
        super();
        const m = this.getByEntryId();
        logger.info("m", m)
    }

    async getBySlug(slug?: string | null | undefined): Promise<PromotionalOffer | undefined> {
        if (isBlank(slug)) {
            return undefined;
        }
        return this.getFirstByField({ name: PromotionalOffer.Field.urlSlug, value: slug });
    }
}