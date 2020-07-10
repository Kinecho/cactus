import { FlamelinkModelService } from "@web/services/FlamelinkService";
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
    }

    async getBySlug(slug?: string | null | undefined): Promise<PromotionalOffer | null> {
        if (isBlank(slug)) {
            return null;
        }
        return await this.getFirstByField({ name: PromotionalOffer.Field.urlSlug, value: slug }) ?? null;
    }
}