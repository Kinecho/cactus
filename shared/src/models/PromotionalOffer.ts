import FlamelinkModel, { SchemaName } from "@shared/FlamelinkModel";

enum Field {
    urlSlug = "urlSlug",
}

export default class PromotionalOffer extends FlamelinkModel {
    static Field = Field;
    schema = SchemaName.promotionalOffer;
    urlSlug?: string;
    displayName?: string;


    constructor(data?: Partial<PromotionalOffer>) {
        super(data);
        Object.assign(this, data);
    }
}