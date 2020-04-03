import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import FlamelinkModel, { SchemaName } from "@shared/FlamelinkModel";

export default class AppSettings extends FlamelinkModel {
    static getSchema(): SchemaName {
        return SchemaName.appSettings;
    }

    schema = SchemaName.appSettings;
    // get schema(): SchemaName {
    //     return AppSettings.getSchema();
    // };

    dataExportEnabledTiers: SubscriptionTier[] = [];

    constructor(data?: Partial<AppSettings>) {
        super(data);
        if (data) {
            Object.assign(this, data);
        }
    }
}